import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedText, organization } = await req.json();

    if (!extractedText) {
      return new Response(
        JSON.stringify({ success: false, error: 'Extracted text is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Gemini API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create prompt for extracting tax information
    const prompt = `
Analyze the following Hungarian tax document and extract the total tax amount paid and the tax period. 
The document contains tax information (járulékok, adók) that needs to be extracted.

Please extract:
- Total tax amount (teljes járulék/adó összeg)
- Tax period (adózási időszak) - CRITICAL: Extract the actual tax period in YYYY-MM-DD format
- Any specific tax breakdown if available

IMPORTANT for date extraction:
- Look for tax period dates like "2025-06", "2025. 06. hónap", "2025 ÉV 06 HÓNAP", etc.
- Convert to YYYY-MM-DD format (use the first day of the month)
- This date should match the payroll period this tax belongs to

Text to analyze:
${extractedText}

Please respond with a JSON object in the following format:
{
  "totalTaxAmount": <number>,
  "taxPeriod": "<string in YYYY-MM-DD format>",
  "taxBreakdown": "<optional string with breakdown details>"
}

IMPORTANT: 
- Return only valid JSON
- totalTaxAmount must be a number (not string)
- taxPeriod must be in YYYY-MM-DD format (first day of the tax period month)
- If you cannot extract the tax amount, return 0
- Extract numbers without currency symbols or formatting
`;

    console.log('Calling Gemini API for tax extraction...');

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
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
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Gemini API error: ${geminiResponse.statusText}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const geminiResult = await geminiResponse.json();
    console.log('Gemini API response:', JSON.stringify(geminiResult, null, 2));

    if (!geminiResult.candidates || !geminiResult.candidates[0] || !geminiResult.candidates[0].content) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response from Gemini API' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const responseText = geminiResult.candidates[0].content.parts[0].text;
    console.log('Raw Gemini response:', responseText);

    // Parse the JSON response from Gemini
    let taxData;
    try {
      // Clean the response text to extract only the JSON part
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      taxData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Response text:', responseText);
      
      // Fallback: try to extract tax amount from text manually
      const amountMatch = responseText.match(/(\d+[\s,.]?\d*)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/[,\s]/g, '')) : 0;
      
      taxData = {
        totalTaxAmount: amount,
        taxPeriod: 'N/A',
        taxBreakdown: 'Automatic extraction failed, manual review needed'
      };
    }

    // Ensure totalTaxAmount is a number
    if (typeof taxData.totalTaxAmount === 'string') {
      taxData.totalTaxAmount = parseFloat(taxData.totalTaxAmount.replace(/[,\s]/g, '')) || 0;
    }

    console.log('Processed tax data:', taxData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: taxData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in tax-gemini function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});