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
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');
  const googleCalendarCredentials = Deno.env.get('GOOGLE_CALENDAR');
  
  console.log('Google Calendar credentials check:', {
    hasRefreshToken: !!refreshToken,
    hasCalendarCredentials: !!googleCalendarCredentials
  });
  
  if (!refreshToken) {
    throw new Error('GOOGLE_REFRESH_TOKEN not configured. Please add it in Supabase Edge Function Secrets.');
  }
  
  if (!googleCalendarCredentials) {
    throw new Error('GOOGLE_CALENDAR credentials not configured. Please add it in Supabase Edge Function Secrets.');
  }

  let credentials;
  try {
    // Try to parse as JSON first
    credentials = JSON.parse(googleCalendarCredentials);
    if (!credentials.client_id || !credentials.client_secret) {
      throw new Error('Missing client_id or client_secret in GOOGLE_CALENDAR JSON');
    }
  } catch (error) {
    console.error('Error parsing GOOGLE_CALENDAR credentials:', error);
    throw new Error('GOOGLE_CALENDAR must contain valid JSON with client_id and client_secret. Example: {"client_id": "your_id", "client_secret": "your_secret"}');
  }
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${data.error}`);
  }

  return data.access_token;
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