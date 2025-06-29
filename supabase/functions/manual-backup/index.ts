import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This function allows manual triggering of backups
    const { dateRange } = await req.json()
    
    // Call the automated backup function
    const backupUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/automated-backup`
    
    const backupResponse = await fetch(backupUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ manual: true, dateRange })
    })

    const backupResult = await backupResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Manual backup triggered successfully',
        backup_result: backupResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Manual backup error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})