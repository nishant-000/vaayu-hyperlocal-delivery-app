import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Return HTTP 410 Gone (Permanently Retired Endpoint)
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: '410 Gone: The generic send-push endpoint has been permanently decommissioned. Transactional events are handled via database triggers, and promotional campaigns use admin-broadcast-push.' 
    }),
    { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
