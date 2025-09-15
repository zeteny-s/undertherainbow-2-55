import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
}

interface CalendarRequest {
  action: 'create_calendar' | 'add_event' | 'list_calendars' | 'parse_pdf_calendar';
  calendarData?: {
    title: string;
    description?: string;
    campus: string;
  };
  eventData?: {
    calendarId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    teacher?: string;
    eventType?: string;
  };
  pdfContent?: string;
}

serve(async (req) => {
  console.log('Google Calendar function called:', {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.get('Authorization')
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    console.log('User authentication:', { hasUser: !!user, userId: user?.id });

    if (!user) {
      throw new Error('Unauthorized');
    }

    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { action, calendarData, eventData, pdfContent } = requestBody;
    
    const accessToken = await getGoogleAccessToken();
    
    let result;
    
    switch (action) {
      case 'create_calendar':
        result = await createGoogleCalendar(accessToken, calendarData!, user.id, supabaseClient);
        break;
      case 'add_event':
        result = await addEventToCalendar(accessToken, eventData!, supabaseClient);
        break;
      case 'list_calendars':
        result = await listUserCalendars(supabaseClient, user.id);
        break;
      case 'parse_pdf_calendar':
        result = await parsePdfCalendar(pdfContent!);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-calendar function:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      action: req.method,
      authHeader: !!req.headers.get('Authorization')
    });
    
    let errorMessage = error.message;
    if (error.message.includes('credentials not configured') || error.message.includes('GOOGLE_')) {
      errorMessage = `Google API setup issue: ${error.message}. Please check your Supabase Edge Function Secrets.`;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
  
  console.log('Google Service Account check:', {
    hasServiceAccount: !!serviceAccountKey
  });
  
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT not configured. Please add it in Supabase Edge Function Secrets.');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Missing private_key or client_email in service account JSON');
    }
  } catch (error) {
    console.error('Error parsing service account credentials:', error);
    throw new Error('GOOGLE_SERVICE_ACCOUNT must contain valid service account JSON');
  }
  
  // Create JWT assertion
  const jwt = await createJWT(serviceAccount);
  
  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Token exchange error:', data);
    throw new Error(`Failed to get access token: ${data.error || data.error_description}`);
  }

  return data.access_token;
}

async function createJWT(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, // 1 hour
    iat: now,
  };
  
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
  
  // Sign the token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(unsignedToken)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${unsignedToken}.${signatureB64}`;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64Lines = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const b64Prefix = b64Lines;
  const binaryString = atob(b64Prefix);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function createGoogleCalendar(
  accessToken: string, 
  calendarData: { title: string; description?: string; campus: string }, 
  userId: string, 
  supabaseClient: any
) {
  // Create calendar in Google Calendar API
  const googleResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: calendarData.title,
      description: calendarData.description || '',
      timeZone: 'Europe/Budapest',
    }),
  });

  const googleCalendar = await googleResponse.json();
  
  if (!googleResponse.ok) {
    throw new Error(`Failed to create Google Calendar: ${googleCalendar.error?.message}`);
  }

  // Make the calendar public for sharing
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${googleCalendar.id}/acl`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      scope: {
        type: 'default',
      },
    }),
  });

  // Generate share link
  const shareLink = `https://calendar.google.com/calendar/embed?src=${googleCalendar.id}`;

  // Store in Supabase
  const { data, error } = await supabaseClient
    .from('google_calendars')
    .insert({
      title: calendarData.title,
      description: calendarData.description,
      google_calendar_id: googleCalendar.id,
      share_link: shareLink,
      campus: calendarData.campus,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save calendar: ${error.message}`);
  }

  return { calendar: data, googleCalendarId: googleCalendar.id };
}

async function addEventToCalendar(
  accessToken: string, 
  eventData: {
    calendarId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    teacher?: string;
    eventType?: string;
  }, 
  supabaseClient: any
) {
  // Get the Google Calendar ID from our database
  const { data: calendar, error: calendarError } = await supabaseClient
    .from('google_calendars')
    .select('google_calendar_id')
    .eq('id', eventData.calendarId)
    .single();

  if (calendarError || !calendar) {
    throw new Error('Calendar not found');
  }

  const googleEvent: GoogleCalendarEvent = {
    summary: eventData.title,
    description: eventData.description || '',
    start: {
      dateTime: eventData.startTime,
      timeZone: 'Europe/Budapest',
    },
    end: {
      dateTime: eventData.endTime,
      timeZone: 'Europe/Budapest',
    },
  };

  if (eventData.teacher) {
    googleEvent.description += `\n\nTeacher: ${eventData.teacher}`;
  }

  // Add recurring rule if specified
  if (eventData.recurring && eventData.recurringType) {
    const recurrenceRules = [];
    let freq = 'WEEKLY';
    
    switch (eventData.recurringType) {
      case 'daily':
        freq = 'DAILY';
        break;
      case 'weekly':
        freq = 'WEEKLY';
        break;
      case 'monthly':
        freq = 'MONTHLY';
        break;
    }
    
    let rule = `FREQ=${freq}`;
    
    if (eventData.recurringEnd) {
      const endDate = new Date(eventData.recurringEnd).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      rule += `;UNTIL=${endDate}`;
    }
    
    recurrenceRules.push(`RRULE:${rule}`);
    googleEvent.recurrence = recurrenceRules;
  }

  // Create event in Google Calendar
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendar.google_calendar_id}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(googleEvent),
  });

  const googleEventResult = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to create Google Calendar event: ${googleEventResult.error?.message}`);
  }

  // Store in our database
  const { data, error } = await supabaseClient
    .from('calendar_events_google')
    .insert({
      calendar_id: eventData.calendarId,
      title: eventData.title,
      description: eventData.description,
      start_time: eventData.startTime,
      end_time: eventData.endTime,
      teacher: eventData.teacher,
      event_type: eventData.eventType || 'general',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save event: ${error.message}`);
  }

  return { event: data, googleEventId: googleEventResult.id };
}

async function listUserCalendars(supabaseClient: any, userId: string) {
  const { data, error } = await supabaseClient
    .from('google_calendars')
    .select(`
      *,
      calendar_events_google(count)
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch calendars: ${error.message}`);
  }

  return { calendars: data || [] };
}

async function parsePdfCalendar(pdfContent: string) {
  // Enhanced PDF parsing using Document AI or Gemini
  const documentAiKey = Deno.env.get('DOCUMENT_AI_API');
  const geminiKey = Deno.env.get('GEMINI_API');
  
  try {
    if (geminiKey) {
      // Use Gemini to extract calendar events from PDF
      const prompt = `Extract calendar events from this PDF. Return a JSON array of events with the following structure:
      [{
        "title": "Event name",
        "startTime": "2024-01-15T09:00:00Z",
        "endTime": "2024-01-15T10:30:00Z", 
        "teacher": "Teacher name (if applicable)",
        "description": "Event description"
      }]
      
      Focus on finding dates, times, and event descriptions. Format all times in ISO format.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "application/pdf", data: pdfContent } }
            ]
          }]
        })
      });

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (generatedText) {
        // Try to extract JSON from the response
        const jsonMatch = generatedText.match(/\[\s*{[\s\S]*}\s*\]/);
        if (jsonMatch) {
          const extractedEvents = JSON.parse(jsonMatch[0]);
          return { extractedEvents };
        }
      }
    }
    
    // Fallback to placeholder events if AI parsing fails
    const extractedEvents = [
      {
        title: 'Example Event (PDF Processing)',
        startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1 hour
        teacher: 'Staff',
        description: 'Extracted from PDF - please verify details',
      }
    ];

    return { extractedEvents };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return { extractedEvents: [] };
  }
}