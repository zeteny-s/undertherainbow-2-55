import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Mapping: employee name → project code (or org-specific map)
const EMPLOYEE_PROJECT_MAPPING = {
  // Dual orgs
  "Édes Nóra": {
    "Alapítvány": "22",
    "Óvoda": "13"
  },
  "Kocsis Ingrid": {
    "Alapítvány": "25",
    "Óvoda": "12"
  },

  // Alapítvány 2024
  "Altinkan Ilknur": "24",
  "Basut Neval": "2",
  "Concepcion Patricia Lucy": "24",
  "Éliás Anett": "23",
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
  "Kovács Ildikó": "11",
  "Kövesi Borbála": "11",
  "Krizsán Ildikó": "13",
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

const RENTAL_EMPLOYEES = [
  "Dobos Katalin",
  "Hegyi András",
  "Kenderesy Dávid",
  "Messmann Stefan",
  "Füles Márta",
  "Tátrai Bálint Marcell"
];

const RENTAL_PROJECT_CODES = {
  "Dobos Katalin": "13",
  "Hegyi András": "13",
  "Kenderesy Dávid": "12",
  "Messmann Stefan": "21,22,23",
  "Füles Márta": "12",
  "Tátrai Bálint Marcell": "11"
};

// Normalize names to match variants
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

function findBestMatch(inputName, nameList) {
  const normalizedInput = normalizeName(inputName);
  for (const official of nameList) {
    if (normalizeName(official) === normalizedInput) return official;
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { extractedText, organization } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API');
    if (!geminiApiKey) throw new Error('GEMINI_API key not found');

    const prompt = `Extract payroll information from this Hungarian payroll document.

I need you to identify individual employee records and extract:

1. Employee Name
2. Amount (gross salary or payment in HUF, number only)
3. Date (YYYY-MM-DD format, representing the actual payroll period or payment month)
4. Rental status (very important — is this employee part of "bérleti díj" or not? Return as isRental: true or false)

Instructions:
- Pay close attention to indicate whether someone is a **bérleti díj** employee.
- Look for Hungarian names and extract accurately.
- Always use the **payroll period date**, not the creation date of the document.
- Accept formats like "2025-06", "2025. 06. hónap", or "2025 ÉV 06 HÓNAP" and convert to YYYY-MM-DD (first day of month).
- Return a clean JSON array of objects with:
  - employeeName
  - amount (number only)
  - date (YYYY-MM-DD)
  - isRental (true/false)

Document:
${extractedText}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const geminiData = await geminiRes.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) throw new Error('No Gemini response content');

    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in response');
    const parsed = JSON.parse(jsonMatch[0]);

    const knownNames = [
      ...Object.keys(EMPLOYEE_PROJECT_MAPPING),
      ...RENTAL_EMPLOYEES
    ];

    const processedRecords = parsed.map((record) => {
      const originalName = record.employeeName || record.name || "";
      const matchedName = findBestMatch(originalName, knownNames) || originalName;

      // Get project code
      let projectCode = null;
      const mapping = EMPLOYEE_PROJECT_MAPPING[matchedName];
      if (typeof mapping === "object") {
        projectCode = mapping[organization] || null;
      } else if (typeof mapping === "string") {
        projectCode = mapping;
      }

      if (RENTAL_PROJECT_CODES[matchedName]) {
        projectCode = RENTAL_PROJECT_CODES[matchedName];
      }

      const isRental = RENTAL_EMPLOYEES.includes(matchedName) || record.isRental === true;

      if (!projectCode) {
        console.warn(`⚠️ Missing project code for: "${matchedName}"`);
      }

      return {
        employeeName: matchedName,
        amount: record.amount,
        date: record.date,
        isRental,
        projectCode,
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

  } catch (err) {
    console.error('Payroll Gemini processing error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
