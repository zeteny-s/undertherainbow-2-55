import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { extractedText } = await req.json();
    // Get Gemini API key from Supabase secrets
    const geminiApiKey = Deno.env.get('GEMINI_API');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API key not found in environment variables');
    }
    const prompt = `Here is the raw data from a hungarian invoice, I need you to extract the following information:

First, determine which organization this invoice belongs to by looking for these indicators:
- "Feketerigó Alapítvány" or similar → should be "Alapítvány"
- "Feketerigó Alapítványi Óvoda" or "óvoda" or similar → should be "Óvoda"

Then check if the invoice is paid by átutalás (bank transfer) or kártya/készpénz/utánvét/online or any other payment method. If you see a payment method called "Csoportos beszédes" treat that as a bank transfer invoice. Plus make sure define the exact payment method when its kártya/készpénz/utánvét/online, so its either "Bankkártya", "Kézpénz", "Utánvét", "Online" payment should called "Bankkártya". These can be on the invoice as these as well if you don't find the original name: 

- **Kártya**  
  - Bankkártya  
  - Hitelkártya  
  - Betéti kártya  
  - Kártyás fizetés

- **Készpénz**
  - Kézpénzes fizetés  
  - Készpénzes tranzakció  

- **Utánvét**  
  - Utánvétes fizetés  
  - Fizetés átvételkor  
  - Kézbesítéskori fizetés  

Its not going to be "Egyéb fizetési mód" in 99% of the cases, you can find the payment type. For bank card write "Bankkártya", for cash write "Kézpénz", for after pay write "Utánvét", for online write "Bankkártya". 

If the invoice is átutalásos (bank transfer) then I need these values:
Szervezet, Partner, Bankszámlaszám, Tárgy, Számla sorszáma, Összeg, Számla kelte, Fizetési határidő

If it's kártya/készpénz/utánvét/online or any other payment method then I need these values:
Szervezet, Partner, Tárgy, Számla sorszáma, Összeg, Számla kelte

# Invoice Data Fields

### Partner  
Could be:  
- Partner  
- Partner neve  
- Partner cég neve  
- Cégnév  
- Név  
- Vevő neve  
- Ügyfél neve  
- Szállító neve  
- Company Name + Formation (e.g., Kft., Bt., Zrt., EV., Nyrt., Ltd., LLC, Inc., GmbH, etc.)  
- Example: Telekom Nyilvánosan Működő Részvénytársaság → Telekom Nyrt.

---

### Bankszámlaszám (only if payment type is bank transfer)  
Could be:  
- Bankszámlaszám  
- Bank account number  
- Fizetési bankszámla  
- Utalási bankszámla  
- Bank account

---

### Tárgy (First product or service mentioned in the invoice)  
Could be:  
- Tárgy  
- Termék neve  
- Szolgáltatás megnevezése  
- Megnevezés  
- Termék  
- Áru  
- Description  
- Product or service name (first one listed)

---

### Összeg (Total amount paid)  
Could be:  
- Összeg  
- Végösszeg  
- Teljes összeg  
- Fizetendő összeg  
- Nettó összeg (if no VAT)  
- Bruttó összeg (total including VAT)  
- Ár  
- Amount  
- Total amount  
- Fizetés összege

---

### Számla Kelte (Invoice date, use YYYY-MM-DD)  
Could be:  
- Számla kelte  
- Kelt  
- Számla dátuma  
- Dátum  
- Invoice date  
- Date of invoice

---

### Fizetési Határidő (Payment deadline, mandatory for bank transfers, YYYY-MM-DD)  
Could be:  
- Fizetési határidő  
- Fizetés határideje  
- Határidő  
- Payment deadline  
- Due date

---

### Számlaszám (Invoice number, must use "Számla sorszáma" if present)  
Could be:  
- Számla sorszáma (preferred if present)  
- Számlaszám  
- Számla szám  
- Invoice number  
- Sorszám  
- Number


Important guidelines:
- Szervezet: Must be exactly "Alapítvány" or "Óvoda" based on the document content
- Partner: Include the company formation (Kft., Bt., Zrt., etc.) in the name
- Bankszámlaszám: Only include if it's a bank transfer payment
- Tárgy: The first product/service mentioned in the invoice
- Összeg: Number only, no currency symbols
- Dates: Use YYYY-MM-DD format


You should categorizes the invoices as well, based on the bought service(s) and product(s), these are the categories, choose the one that best fits the invoice: 

- Bérleti díjak  
- Közüzemi díjak  
- Szolgáltatások  
- Étkeztetés költségei  
- Személyi jellegű kifizetések  
- Anyagköltség  
- Tárgyi eszközök  
- Felújítás, beruházások  
- Egyéb  



For bank transfer invoices always look for "Fizetési Határidő". There are kártya/készpénz/utánvét/online invoices where the "Számla Kelte" is not defined, in this case, there is only going to be one date on the invoice in the format YYYY-MM-DD, use this date as the "Számla Kelte". 

Please respond with a JSON object containing the extracted data. Use null for missing values.

Invoice text:
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
      
      // Try to get more detailed error information
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = `Gemini API error: ${errorData.error?.message || errorData.message || response.statusText}`;
        } catch (e) {
          // If JSON parsing fails, stick with the basic error message
        }
      } else if (contentType && contentType.includes('text/html')) {
        // If we got HTML (error page), don't try to parse it
        const htmlText = await response.text();
        console.error('Received HTML error response from Gemini:', htmlText);
        errorMessage = `Gemini API returned HTML error page (status ${response.status}). This often indicates an API key or configuration issue.`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('Unexpected response type from Gemini:', contentType, 'Response:', responseText);
      throw new Error(`Expected JSON response from Gemini but got ${contentType}`);
    }
    
    const result = await response.json();
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }
    // Try to extract JSON from the response
    let parsedData;
    try {
      // Look for JSON in the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', generatedText);
      throw new Error('Failed to parse AI response');
    }
    // Ensure the organization is properly set
    if (!parsedData.Szervezet) {
      // Fallback: try to determine from the text
      if (extractedText.toLowerCase().includes('óvoda')) {
        parsedData.Szervezet = 'Óvoda';
      } else {
        parsedData.Szervezet = 'Alapítvány';
      }
    }
    return new Response(JSON.stringify({
      success: true,
      data: parsedData,
      rawResponse: generatedText
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Gemini processing error:', error);
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
