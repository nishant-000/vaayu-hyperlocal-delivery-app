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

  try {
    const { tokens, title, body, data } = await req.json()

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No push tokens provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: title || 'Vaayu Notification',
      body: body || '',
      data: data || {},
    }))

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

    // Clean up invalid tokens if Expo reports DeviceNotRegistered
    const invalidTokens: string[] = []
    if (expoResult.data && Array.isArray(expoResult.data)) {
      expoResult.data.forEach((receipt: any, idx: number) => {
        if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
          invalidTokens.push(tokens[idx])
        }
      })
    }

    if (invalidTokens.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await supabase
          .from('push_tokens')
          .delete()
          .in('token', invalidTokens)
        console.log(`Cleaned up ${invalidTokens.length} unregistered tokens:`, invalidTokens)
      }
    }

    return new Response(
      JSON.stringify({ success: true, expoResult, cleanedTokens: invalidTokens }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
