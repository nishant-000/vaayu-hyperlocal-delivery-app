import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Verify Ingress Vault Secret (Supports zero-downtime dual-secret rotation)
    const incomingSecret = req.headers.get('x-webhook-secret')
    const currentSecret = Deno.env.get('TRANSACTIONAL_PUSH_SECRET')
    const previousSecret = Deno.env.get('TRANSACTIONAL_PUSH_SECRET_PREVIOUS')

    const isAuthorized = incomingSecret && (
      incomingSecret === currentSecret || 
      (previousSecret && incomingSecret === previousSecret)
    )

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Transactional push notifications can only be triggered by internal database infrastructure.' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Accept Payload: { tokens, title, body, data } (Strict validation)
    const payload = await req.json()
    const { tokens, title, body, data } = payload

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No push tokens provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Batch Dispatch to Expo Push Gateway (Max 100 per chunk)
    const chunkSize = 100
    const chunks: string[][] = []
    for (let i = 0; i < tokens.length; i += chunkSize) {
      chunks.push(tokens.slice(i, i + chunkSize))
    }

    const invalidTokens: string[] = []
    let totalSuccess = 0

    for (const chunk of chunks) {
      const messages = chunk.map(token => ({
        to: token,
        sound: 'default',
        title: title || 'Vaayu Notification',
        body: body || '',
        data: data || {},
      }))

      try {
        const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        })

        const expoResult = await expoResponse.json()

        if (expoResult.data && Array.isArray(expoResult.data)) {
          expoResult.data.forEach((receipt: any, idx: number) => {
            if (receipt.status === 'ok') {
              totalSuccess++
            } else if (receipt.status === 'error') {
              if (receipt.details?.error === 'DeviceNotRegistered') {
                invalidTokens.push(chunk[idx])
              }
            }
          })
        }
      } catch (networkErr: any) {
        // Dead-letter capture to notification_failures on network / provider timeout
        await supabase.from('notification_failures').insert({
          order_id: data?.orderId || null,
          endpoint: '/functions/v1/transactional-push',
          payload: { tokensCount: chunk.length, title, body, data },
          error: `Expo gateway error: ${networkErr.message}`
        })
      }
    }

    // 4. Dead Token Cleanup
    if (invalidTokens.length > 0) {
      await supabase
        .from('push_tokens')
        .delete()
        .in('token', invalidTokens)
    }

    // 5. Return Delivery Receipts
    return new Response(
      JSON.stringify({
        success: true,
        dispatched: totalSuccess,
        totalTokens: tokens.length,
        cleanedTokens: invalidTokens.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    // Dead-letter log unexpected exceptions
    await supabase.from('notification_failures').insert({
      endpoint: '/functions/v1/transactional-push',
      payload: {},
      error: `Unhandled runtime error: ${error.message}`
    })

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
