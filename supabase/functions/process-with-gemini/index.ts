import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { extractedText, organization } = await req.json()
    
    // Get Gemini API key from Supabase secrets
    const geminiApiKey = Deno.env.get('GEMINI_API')
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API key not found in environment variables')
    }

    const prompt = `Here is the raw data from a hungarian invoice, I need to get to first check if the invoice is either payed by átutalás or kártya/kézpénz/utánvét/online or any other payment method, if the invoice is átutalásos then I need these values from it:

Szervezet	Partner	Bankszámlaszám	Tárgy	Számla sorszáma	Összeg	Számla kelte	Fizetési határidő

The szervezet is is either Feketerigó Alapítvány for which write "Alapítvány" or either Feketerigó Alapítványi Óvoda for which write "Óvoda". The partner is the company we bought the product/service from for the partner its important to include the company formation they have, so for example if the company name is let's say "My Company" and the formation is "Kft (korlátolt felelőségű társaság) then say "My Company Kft." same for other formations like EV (Egyéni vállalkozó), Bt (betéti társaság), etc. it has to be included in the partners name . The bankszámlaszám is the bankszámlaszám of the partner. The Tárgy should be the first product/service in the invoice. The others are straight forward.

If the kártya/kézpénz/utánvét/online or any other payment  method then I need these values:

Szervezet	Partner	Tárgy	Számla sorszáma	Összeg	Számla kelte

Please respond with a JSON object containing the extracted data. Use null for missing values. For dates, use YYYY-MM-DD format. For amounts, use numbers without currency symbols.

Invoice text:
${extractedText}`

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
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
          maxOutputTokens: 2048,
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const result = await response.json()
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('No response from Gemini API')
    }

    // Try to extract JSON from the response
    let parsedData
    try {
      // Look for JSON in the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', generatedText)
      throw new Error('Failed to parse AI response')
    }

    // Set the organization based on the parameter passed
    parsedData.Szervezet = organization === 'alapitvany' ? 'Alapítvány' : 'Óvoda'

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: parsedData,
        rawResponse: generatedText 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Gemini processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})