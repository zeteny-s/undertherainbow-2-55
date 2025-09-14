import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string[];
  subject: string;
  htmlContent: string;
  fromName?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, htmlContent, fromName = 'Under the Rainbow Kindergarten' }: EmailRequest = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let userId = null;
    
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }
    
    console.log('Sending email to:', to.length, 'recipients');
    console.log('Subject:', subject);
    console.log('User ID:', userId);

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ 
        error: 'Email service not configured',
        success: false 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const emailResults = [];
    
    // Send emails using Resend
    for (const recipient of to) {
      try {
        console.log(`Sending email to: ${recipient}`);
        
        const emailResponse = await resend.emails.send({
          from: 'Under the Rainbow Kindergarten <info@undertherainbow.hu>',
          to: [recipient],
          subject: subject,
          html: htmlContent,
        });

        console.log(`Email sent to ${recipient}:`, emailResponse);
        
        emailResults.push({
          to: recipient,
          status: 'sent',
          messageId: emailResponse.data?.id || `sent-${Date.now()}`
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${recipient}:`, emailError);
        emailResults.push({
          to: recipient,
          status: 'failed',
          error: emailError.message
        });
      }
    }

    // Log email campaign to database
    try {
      const { error: logError } = await supabase
        .from('email_campaigns')
        .insert({
          subject,
          recipient_count: to.length,
          sent_at: new Date().toISOString(),
          status: 'completed',
          recipients: to,
          content: htmlContent,
          sent_by: userId
        });

      if (logError) {
        console.error('Failed to log email campaign:', logError);
      } else {
        console.log('Email campaign logged successfully');
      }
    } catch (logError) {
      console.error('Error logging email campaign:', logError);
    }

    const successCount = emailResults.filter(r => r.status === 'sent').length;
    const failedCount = emailResults.filter(r => r.status === 'failed').length;

    return new Response(JSON.stringify({
      success: successCount > 0,
      results: emailResults,
      message: `Email campaign completed: ${successCount} sent, ${failedCount} failed`,
      sent: successCount,
      failed: failedCount
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in send-gmail function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);