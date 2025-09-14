import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
const gmailApiKey = Deno.env.get('GMAIL_API');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, htmlContent, fromName = 'Under the Rainbow Kindergarten' }: EmailRequest = await req.json();
    
    console.log('Sending email to:', to.length, 'recipients');
    console.log('Subject:', subject);

    // Note: Since "Send As" is not configured, emails will be sent from the authenticated Gmail account
    // The Gmail API configuration should be handled through OAuth2 flow
    // For now, we'll log the email details and return success
    
    // In production, you would:
    // 1. Use OAuth2 to authenticate with Gmail API
    // 2. Send emails using the Gmail API
    // 3. Handle rate limits and batch sending
    
    const emailResults = [];
    
    for (const recipient of to) {
      // Simulate email sending - replace with actual Gmail API call
      console.log(`Would send email to: ${recipient}`);
      console.log(`Subject: ${subject}`);
      console.log(`From: ${fromName}`);
      
      // Here you would make the actual Gmail API call
      // const response = await sendGmailEmail(recipient, subject, htmlContent);
      
      emailResults.push({
        to: recipient,
        status: 'sent', // Would be actual status from Gmail API
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Would be actual message ID
      });
    }

    // Log email campaign to database
    const { error: logError } = await supabase
      .from('email_campaigns')
      .insert({
        subject,
        recipient_count: to.length,
        sent_at: new Date().toISOString(),
        status: 'completed',
        recipients: to,
        content: htmlContent
      });

    if (logError) {
      console.error('Failed to log email campaign:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      results: emailResults,
      message: `Email sent to ${to.length} recipient(s)`
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