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
    const { extractedText } = await req.json()
    
    // Get Gemini API key from Supabase secrets
    const geminiApiKey = Deno.env.get('GEMINI_API')
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API key not found in environment variables')
    }

    const prompt = `Here is the raw data from a hungarian invoice, I need you to extract the following information:

First, determine which organization this invoice belongs to by looking for these indicators:
- "Feketerigó Alapítvány" or similar → should be "Alapítvány"
- "Feketerigó Alapítványi Óvoda" or "óvoda" or similar → should be "Óvoda"

Then check if the invoice is paid by átutalás (bank transfer) or kártya/készpénz/utánvét/online or any other payment method.

If the invoice is átutalásos (bank transfer) then I need these values:
Szervezet, Partner, Bankszámlaszám, Tárgy, Számla sorszáma, Összeg, Számla kelte, Fizetési határidő

If it's kártya/készpénz/utánvét/online or any other payment method then I need these values:
Szervezet, Partner, Tárgy, Számla sorszáma, Összeg, Számla kelte

Important guidelines:
- Szervezet: Must be exactly "Alapítvány" or "Óvoda" based on the document content
- Partner: Include the company formation (Kft., Bt., Zrt., etc.) in the name
- Bankszámlaszám: Only include if it's a bank transfer payment
- Tárgy: The first product/service mentioned in the invoice
- Összeg: Number only, no currency symbols
- Dates: Use YYYY-MM-DD format

Please respond with a JSON object containing the extracted data. Use null for missing values.

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

    // Ensure the organization is properly set
    if (!parsedData.Szervezet) {
      // Fallback: try to determine from the text
      if (extractedText.toLowerCase().includes('óvoda')) {
        parsedData.Szervezet = 'Óvoda'
      } else {
        parsedData.Szervezet = 'Alapítvány'
      }
    }

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