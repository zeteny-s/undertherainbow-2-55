import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Tax Gemini function called');
    
    const { extractedText, organization } = await req.json();
    
    if (!extractedText) {
      throw new Error('Missing extractedText parameter');
    }

    console.log('Processing tax document for organization:', organization);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API key not configured');
    }

    const prompt = `
A következő dokumentumból kivonja a teljes adóösszeget (járulék). A dokumentum tartalmazza az alkalmazottak utáni adókat és járulékokat.

Kérlek, add meg a teljes adó/járulék összeget számként (csak a szám, valuta nélkül).

A dokumentum tartalma:
${extractedText}

Válaszolj csak a következő JSON formátumban:
{
  "success": true,
  "totalTaxAmount": [szám],
  "currency": "HUF"
}

Ha nem sikerül kinyerni az összeget, akkor:
{
  "success": false,
  "error": "Nem sikerült kinyerni az adó összeget"
}
`;

    console.log('Sending request to Gemini API');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
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
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated text:', generatedText);

    try {
      // Clean the response to extract JSON
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      if (!result.success) {
        console.error('Tax extraction failed:', result.error);
        return new Response(
          JSON.stringify({ success: false, error: result.error }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Tax amount extracted successfully:', result.totalTaxAmount);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            totalTaxAmount: result.totalTaxAmount,
            currency: result.currency || 'HUF',
            organization: organization
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', generatedText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to parse tax amount from document' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in tax-gemini function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})