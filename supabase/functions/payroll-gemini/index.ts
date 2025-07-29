import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Employee to project code mapping
const EMPLOYEE_PROJECT_MAPPING = {
  // Alapítvány 2024
  "Altinkan Ilknur": "24",
  "Basut Neval": "2",
  "Concepcion Patricia Lucy": "24",
  "Édes Nóra": "22",
  "Éliás Anett": "23",
  "Kocsis Ingrid": "25",
  "Lâm Gia Linh": "1",
  "Mahmudova Vafa": "25",
  "Manit Grace Honey": "2",
  "Milosevic Jelena": "23",
  "Nakano Asuka": "22",
  "Namugala Rhita Fisher": "21",
  "Oláh Annamária": "21",
  "Oláh Dragana": "2",
  "Opao Salve Marjorette": "2",
  "Paraginé Ébel Emese": "2",
  "Petri Barbara": "4",
  "Pollákné Hercsel Flóra": "2",
  "Tóth Zoltán Krisztián": "2",
  
  // Óvoda 2024
  "Almendros Estabillo Teresita": "1",
  "Balbon Aliza": "11",
  "Balogh Ildikó": "12",
  "Barnáné Czéklás Alexandra": "12",
  "Darai Lili": "13",
  "Dudás Réka": "13",
  "Ébel-Udvari Gabriella": "1",
  "Elsayed Sarrah": "12",
  "Fullante Anna Dolores": "11",
  "Gabányi Attiláné": "13",
  "Gábornyik Kitti": "11",
  "Jerkovich Laure May": "12",
  "Ma Hong": "12",
  "Madarász Andrea": "11",
  "Mihály Judit": "1",
  "Mytilinaiou Kleio": "12",
  "Nagy Edit": "11",
  "Ocelka Krisztina": "12",
  "Puskás Hanna": "12",
  "Szakály Tímea": "13",
  "Székely Ágota": "11",
  "Üveges Fanni": "11",
  "Vintena Anna": "11",
  "Vitus Júlia": "13"
};

// Rental employees (should be marked as is_rental = true)
const RENTAL_EMPLOYEES = [
  "Dobos Katalin",
  "Hegyi András", 
  "Kenderesy Dávid",
  "Messmann Stefan",
  "Füles Márta",
  "Tátrai Bálint Marcell"
];

// Special project codes for rental employees
const RENTAL_PROJECT_CODES = {
  "Kenderesy Dávid": "12",
  "Füles Márta": "12",
  "Tátrai Bálint Marcell": "11"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { extractedText, organization } = await req.json();

    // Get Gemini API key from Supabase secrets
    const geminiApiKey = Deno.env.get('GEMINI_API');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API key not found in environment variables');
    }

    const prompt = `Extract payroll information from this Hungarian payroll document. I need you to identify individual employee records and extract:

1. Employee Name
2. Amount (salary/payment amount in HUF, number only)
3. Date (YYYY-MM-DD format) - This should be the actual payroll period or payment date from the document

Important guidelines:
- Look for employee names that match Hungarian naming conventions
- Extract the gross salary amount for each employee
- CRITICAL: Extract the actual payroll period date or payment month/year from the document
- Look for dates in formats like "2025-06", "2025. 06. hónap", "2025 ÉV 06 HÓNAP", etc.
- Convert the period to YYYY-MM-DD format (use the first day of the month)
- Return each employee as a separate record
- If multiple dates are found, use the payroll period date, not the document creation date

Please respond with a JSON array containing objects with these fields:
- employeeName: string
- amount: number (no currency symbols)
- date: string (YYYY-MM-DD format, representing the payroll period)

Payroll document text:
${extractedText}`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `Gemini API error: ${response.status} ${response.statusText}`;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = `Gemini API error: ${errorData.error?.message || errorData.message || response.statusText}`;
        } catch (e) {
          // If JSON parsing fails, stick with the basic error message
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Try to extract JSON from the response
    let parsedData;
    try {
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', generatedText);
      throw new Error('Failed to parse AI response');
    }

    // Process each employee record
    const processedRecords = parsedData.map((record: any) => {
      const employeeName = record.employeeName || record.employee_name || record.name;
      const amount = record.amount;
      const date = record.date;

      // Determine project code
      let projectCode = EMPLOYEE_PROJECT_MAPPING[employeeName as keyof typeof EMPLOYEE_PROJECT_MAPPING];
      
      // Check for rental employee special project codes
      if (RENTAL_PROJECT_CODES[employeeName as keyof typeof RENTAL_PROJECT_CODES]) {
        projectCode = RENTAL_PROJECT_CODES[employeeName as keyof typeof RENTAL_PROJECT_CODES];
      }

      // Determine if rental employee
      const isRental = RENTAL_EMPLOYEES.includes(employeeName);

      return {
        employeeName,
        projectCode: projectCode || null,
        amount,
        date,
        isRental,
        organization
      };
    });

    return new Response(JSON.stringify({
      success: true,
      data: processedRecords,
      rawResponse: generatedText
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Payroll Gemini processing error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});