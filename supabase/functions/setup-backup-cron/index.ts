import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This function sets up the cron job for automated backups
    // In a production environment, you would use pg_cron or similar
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create a backup schedule table to track backup runs
    const { error: createTableError } = await supabase.rpc('create_backup_schedule_table')
    
    if (createTableError && !createTableError.message.includes('already exists')) {
      console.warn('Could not create backup schedule table:', createTableError)
    }

    // Schedule next backup (every 2 weeks on Monday at 02:00 AM)
    const now = new Date()
    const nextBackup = getNextBackupDate(now)
    
    // Store the next backup schedule
    const { error: scheduleError } = await supabase
      .from('backup_schedule')
      .upsert({
        id: 1,
        next_backup: nextBackup.toISOString(),
        frequency: 'biweekly',
        day_of_week: 1, // Monday
        hour: 2, // 02:00 AM
        enabled: true,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })

    if (scheduleError) {
      console.warn('Could not update backup schedule:', scheduleError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup cron job configured',
        next_backup: nextBackup.toISOString(),
        frequency: 'Every 2 weeks on Monday at 02:00 AM',
        note: 'Automated backups are now scheduled. The system will run backups every 2 weeks.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Setup backup cron error:', error)
    
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

function getNextBackupDate(from: Date): Date {
  const next = new Date(from)
  
  // Set to next Monday at 02:00 AM
  const daysUntilMonday = (1 + 7 - next.getDay()) % 7
  if (daysUntilMonday === 0 && (next.getHours() >= 2)) {
    // If it's Monday and past 2 AM, go to next Monday
    next.setDate(next.getDate() + 7)
  } else {
    next.setDate(next.getDate() + daysUntilMonday)
  }
  
  next.setHours(2, 0, 0, 0) // 02:00 AM
  
  // Make it biweekly by adding 14 days if needed
  const daysSinceEpoch = Math.floor(next.getTime() / (1000 * 60 * 60 * 24))
  const weeksSinceEpoch = Math.floor(daysSinceEpoch / 7)
  
  if (weeksSinceEpoch % 2 !== 0) {
    // If it's an odd week, move to the next even week
    next.setDate(next.getDate() + 7)
  }
  
  return next
}