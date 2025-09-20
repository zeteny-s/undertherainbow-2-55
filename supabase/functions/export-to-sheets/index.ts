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
  
    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await createJWT(serviceAccountKey)
      })
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    // Determine which sheet to use based on payment type
    const sheetName = invoiceData.paymentType === 'bank_transfer' ? 'Átutalásos' : 'KP';
    const spreadsheetId = '1mF8EhC7BFSfxSKlvVvvYcJP8UDFSjWDucO2bCQeK1b8';
    // Prepare row data based on payment type
    let rowData;
    if (invoiceData.paymentType === 'bank_transfer') {
      // Átutalásos sheet: Szervezet, Partner, Bankszámlaszám, Munkaszám, Tárgy, Számla sorszáma, Összeg, Számla kelte, Fizetési határidő
      rowData = [
        organization === 'alapitvany' ? 'Alapítvány' : 'Óvoda',
        invoiceData.Partner || '',
        invoiceData.Bankszámlaszám || '',
        invoiceData.Munkaszám || '',
        invoiceData.Tárgy || '',
        invoiceData['Számla sorszáma'] || '',
        invoiceData.Összeg || '',
        invoiceData['Számla kelte'] || '',
        invoiceData['Fizetési határidő'] || ''
      ];
    } else {
      // KP sheet: Szervezet, Partner, Tárgy, Számla sorszáma, Összeg, Számla kelte, MUNKASZÁM, Fizetési Mód
      rowData = [
        organization === 'alapitvany' ? 'Alapítvány' : 'Óvoda',
        invoiceData.Partner || '',
        invoiceData.Tárgy || '',
        invoiceData['Számla sorszáma'] || '',
        invoiceData.Összeg || '',
        invoiceData['Számla kelte'] || '',
        invoiceData.Munkaszám || '',
        invoiceData.specificPaymentMethod || invoiceData.payment_method || 'Bankkártya'
      ];
    }
    // Add to Google Sheets
    const range = `${sheetName}!A:Z`;
    const sheetsResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [
          rowData
        ]
      })
    });
    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text();
      throw new Error(`Google Sheets API error: ${sheetsResponse.statusText} - ${errorText}`);
    }
    const sheetsResult = await sheetsResponse.json();
    return new Response(JSON.stringify({
      success: true,
      result: sheetsResult
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Google Sheets export error:', error);
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
async function createJWT(serviceAccount) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  // Import the private key
  const privateKey = await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(serviceAccount.private_key), {
    name: 'RSASSA-PKCS1-v1_5',
    hash: 'SHA-256'
  }, false, [
    'sign'
  ]);
  // Sign the JWT
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(signatureInput));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${signatureInput}.${encodedSignature}`;
}
function pemToArrayBuffer(pem) {
  const pemContents = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for(let i = 0; i < binaryString.length; i++){
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
