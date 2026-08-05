import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // 1. Authenticate Caller JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required. Missing Bearer token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const jwtToken = authHeader.replace('Bearer ', '').trim()
    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwtToken}` } }
    })
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser(jwtToken)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid user session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Authorize Admin Role (Zero Tolerance for non-admins)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Forbidden: Only verified administrators can broadcast promotional notifications.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Validate Broadcast Payload
    const { channel, title, body, data, idempotency_key } = await req.json()

    if (!channel || (channel !== 'all_customers' && channel !== 'all_shop_owners')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid channel. Must be 'all_customers' or 'all_shop_owners'." 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!title || !body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Title and body are required for promotional broadcasts.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Rate Limiting Check (Max 1 broadcast every 5 minutes per channel)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentBroadcasts } = await supabaseAdmin
      .from('admin_broadcast_logs')
      .select('id, created_at')
      .eq('channel', channel)
      .gte('created_at', fiveMinutesAgo)
      .limit(1)

    if (recentBroadcasts && recentBroadcasts.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Rate limit exceeded: A promotional broadcast to channel [${channel}] was already sent within the last 5 minutes.`
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Idempotency Check (Prevent duplicate triggers)
    const effectiveIdempotencyKey = idempotency_key || `${channel}_${title}_${new Date().toISOString().slice(0, 13)}`
    const { data: existingLog } = await supabaseAdmin
      .from('admin_broadcast_logs')
      .select('id')
      .eq('idempotency_key', effectiveIdempotencyKey)
      .maybeSingle()

    if (existingLog) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Duplicate broadcast rejected: This campaign has already been dispatched.'
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Fetch Target Tokens by Audience Role
    const targetRole = channel === 'all_customers' ? 'customer' : 'shop_owner'
    const { data: profileRecords, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', targetRole)

    if (profileFetchError || !profileRecords || profileRecords.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: `No active users found for channel ${channel}`, sentCount: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userIds = profileRecords.map((p: any) => String(p.id))
    const { data: pushTokens, error: tokensError } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds)

    if (tokensError || !pushTokens || pushTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: `No push tokens registered for channel ${channel}`, sentCount: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const uniqueTokens = Array.from(new Set(pushTokens.map((t: any) => t.token)))

    // 7. Dispatch in Chunks of 100
    const chunkSize = 100
    const chunks: string[][] = []
    for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
      chunks.push(uniqueTokens.slice(i, i + chunkSize))
    }

    let totalDispatched = 0
    for (const chunk of chunks) {
      const messages = chunk.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: { ...data, broadcastChannel: channel, promo: true },
      }))

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      })

      totalDispatched += chunk.length
    }

    // 8. Write Audit Log
    await supabaseAdmin.from('admin_broadcast_logs').insert({
      admin_id: user.id,
      channel,
      title,
      body,
      data: data || {},
      recipient_count: uniqueTokens.length,
      idempotency_key: effectiveIdempotencyKey,
      status: 'completed'
    })

    return new Response(
      JSON.stringify({
        success: true,
        channel,
        totalRecipients: uniqueTokens.length,
        dispatchedCount: totalDispatched,
        title,
        idempotencyKey: effectiveIdempotencyKey
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
