import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Name aliases for consistency
const NAME_ALIASES: Record<string, string> = {
  "Kelemen Krisztián": "Kelemen Krisztián",
  "Kelemen Krisztian": "Kelemen Krisztián",
  "Darvas Péter": "Darvas Péter",
  "Darvas Peter": "Darvas Péter",
  "Nagy Tamás": "Nagy Tamás",
  "Nagy Tamas": "Nagy Tamás",
  "Kovács András": "Kovács András",
  "Kovacs Andras": "Kovács András",
  "Szabó Gábor": "Szabó Gábor",
  "Szabo Gabor": "Szabó Gábor",
  "Horváth Zoltán": "Horváth Zoltán",
  "Horvath Zoltan": "Horváth Zoltán",
  "Tóth László": "Tóth László",
  "Toth Laszlo": "Tóth László",
  "Varga Mihály": "Varga Mihály",
  "Varga Mihaly": "Varga Mihály",
  "Kiss Attila": "Kiss Attila",
  "Molnár József": "Molnár József",
  "Molnar Jozsef": "Molnár József",
  "Németh Péter": "Németh Péter",
  "Nemeth Peter": "Németh Péter"
};

// Employee to project code mapping for cash payments
const CASH_EMPLOYEE_PROJECT_MAPPING: Record<string, Record<string, string>> = {
  alapitvany: {
    "Kelemen Krisztián": "HU-ÁLT-001",
    "Darvas Péter": "HU-ÁLT-002", 
    "Nagy Tamás": "HU-ÁLT-003",
    "Kovács András": "HU-ÁLT-004",
    "Szabó Gábor": "HU-ÁLT-005"
  },
  ovoda: {
    "Horváth Zoltán": "HU-ÓVD-001",
    "Tóth László": "HU-ÓVD-002",
    "Varga Mihály": "HU-ÓVD-003", 
    "Kiss Attila": "HU-ÓVD-004",
    "Molnár József": "HU-ÓVD-005",
    "Németh Péter": "HU-ÓVD-006"
  }
};

function normalizeName(name: string): string {
  return name.trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findBestMatch(inputName: string, knownNames: string[]): string | null {
  const normalizedInput = normalizeName(inputName);
  
  for (const knownName of knownNames) {
    const normalizedKnown = normalizeName(knownName);
    if (normalizedInput.includes(normalizedKnown) || normalizedKnown.includes(normalizedInput)) {
      return knownName;
    }
  }
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedText, organization } = await req.json();

    if (!extractedText) {
      throw new Error('No extracted text provided');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API key not found in environment variables');
    }

    const prompt = `
    Extract cash payroll data from this Hungarian document text. This document contains information about cash payments made to employees.

    Document text:
    ${extractedText}

    CRITICAL INSTRUCTIONS:
    - ONLY extract data that clearly represents employee payments
    - Employee names MUST be real Hungarian names (format: "Surname Firstname" like "Nagy Tamás", "Kovács András")
    - Amounts MUST be realistic salary amounts (typically 50,000 - 500,000 HUF range)
    - Ignore any non-employee entries like totals, headers, company names, addresses, or administrative text
    - Look specifically for cash payments, készpénzes kifizetések, or similar terms
    - Skip any entries that don't have both a clear employee name AND a clear monetary amount

    VALIDATION RULES:
    - Employee name must contain at least 2 words (surname + firstname)
    - Amount must be a positive number greater than 10,000 HUF
    - Date must be extractable and valid
    - Ignore entries like "Összesen", "Total", company names, addresses, or any administrative text

    Return only a JSON array with VALID employee payment data in this exact format:
    [
      {
        "employeeName": "Nagy Tamás",
        "amount": 150000,
        "date": "2024-01-15",
        "isCash": true,
        "paymentType": "cash"
      }
    ]

    If no valid employee payment data is found, return an empty array: []
    Return ONLY the JSON array, no other text or explanations.
    `;

    console.log('Sending request to Gemini API for cash payroll processing...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Raw Gemini response:', JSON.stringify(data, null, 2));

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated text from Gemini:', generatedText);

    // Parse the JSON response
    let extractedRecords;
    try {
      // Clean the response to extract just the JSON array
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      extractedRecords = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      throw new Error(`Failed to parse extracted data: ${parseError.message}`);
    }

    // Process each record
    const processedRecords = extractedRecords.map((record: any) => {
      // Resolve name aliases
      let resolvedName = NAME_ALIASES[record.employeeName] || record.employeeName;
      
      // Try fuzzy matching if exact match not found
      if (!NAME_ALIASES[record.employeeName]) {
        const allKnownNames = Object.values(NAME_ALIASES);
        const bestMatch = findBestMatch(record.employeeName, allKnownNames);
        if (bestMatch) {
          resolvedName = bestMatch;
        }
      }

      // Determine project code
      const orgMapping = CASH_EMPLOYEE_PROJECT_MAPPING[organization] || {};
      const projectCode = orgMapping[resolvedName] || null;

      return {
        employeeName: resolvedName,
        amount: parseFloat(record.amount),
        date: record.date,
        projectCode: projectCode,
        isCash: true,
        paymentType: 'cash',
        organization: organization
      };
    });

    console.log('Processed cash payroll records:', JSON.stringify(processedRecords, null, 2));

    return new Response(JSON.stringify({
      success: true,
      records: processedRecords
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in payroll-cash-gemini function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});