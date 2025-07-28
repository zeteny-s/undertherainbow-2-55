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
    const { invoiceData, organization } = await req.json();
    const serviceAccountKey = {
      "type": "service_account",
      "project_id": "alert-ability-434512-h1",
      "private_key_id": "37d9db96d27ad7ad3c5db7f7cc4298c5a6462130",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCZQu44w9dcjU1i\nsATweMaabxBAhEsacR11Cx+AsGtdxyEDYd3UCRA/ZkIcKz/rvRGE8pDGzWXbmHhs\nhQmhFoJBMHnXO+i6gl4Sx9uvSZlscOqh+G0FjGoOjFDEfNxxmwco2iiui4N7uM8I\n2D9UUP5Gtpev+4YSztPGjMy0vVhEGh0P19zr3V2vlKwDJzLzvlsWIk05+WdebpQm\nO4GZnGDGam5dS8vqxtKmkkdbkFzwh4jXrX6JZUXi5/jZ3UwaATlC3KZcVVZeQfer\ndauIDQZubnvOOTsW8rNjVMEeJPMAJyGeuMdqkEEqVpW4j4P/lQOgTeuUkOFpNZJI\n3LkApGuVAgMBAAECggEABQ/RV12cfMmL70D6AMk0YgBeDItyAY8P1oBGC5WIDkJX\n5Ek0rt6Xw0hI0a5Z/5qwe/AY+P/qp8yK2aaxMTlRlv6XX5TydEp++ebQ6iKnpw25\nqhzO2PqQvCdFOaAYFcZ1f5No+Y7RCmKJr/SYbtv38fTw4JaRkIh1NR8MWcHRKvqW\nupmqZ4W31yg/L1ORPTDL0C9DwcDCV7bsRPMmcXbMD275vToZgj+SJBUt2pe/UyDE\nbRXCcWX1Kbdwj0Pfa4rfgx1s96HCM9vmBzBL7wI0oSJ9nB8tBVvhtJu0dds24I1x\nlMfeFQuj/ee0FuBbK8i70Wb942HV3QRQFbj2UqYWZwKBgQDGFc1AOzUXWCTuj6KF\nS+v8MBJeiXnfk+1f1BmdJtjAbF+8PQp08yFqOlFCZl4ZxYGTLcN/ISR+QpwOI9SQ\nGOHKSrLVg5T2efRPACoU+8lP/43q+kvqBw44VGYaAe2dJzPOj2uEoLm8I10KbVHa\n5d8ojWNlLTbihVqik9WtZAO/uwKBgQDGEi5yrmVKMzwiCHPB98UBaCcAmwemfFrE\nkZhLoJDxovPKK6DgLlZqTAvN7dn7ZEGP95jM8g1D2bSdN/bLVKW5mbr8L8Xk0NXr\n9KUL5ZpFgItwpP+So82lhOtVQjhQI4rQsoX9E8pzk6LpEwJIRzKAo4a6ZjOWWuAR\ntMkQvliE7wKBgQDBhKci6zTw+4IJNnYWN5fyppwrk69nB8PN7Q6hA0SaqMXWxuOi\nYazxdMvSTOP91YDDYuAtIRnf5/9BqSuPI1/jG5sfEQ/ExFwzmfuCyIFiEE57k8/6\ncK4pxfqBygRzlcr9MAxgZA1QilPpTee8LPsZSRgjzkpiftmPH1KPtLgc5QKBgHo9\n+Fqg1TSRIFikvMSGZRi0LfYKuBMBBofwj3yFUU9AUZOBj50sG/soidSDKhgjzO7M\nUYqTDKrGbtjlFDRzPoCopyVDWrAYTx5782y/PJIOfoB75Juc6qtvuEn7P4P+G4sn\n0tfZYgYopM+SAsOW5U1NHzZlIwt1dHqZB8qEn18TAoGBAIFJg1glfm91N863hmHu\nxuK6KdASy4RENIbE2HyeC6hUz3f9R5n/tHiuEuCfIRvZSKZ3xTZ0n/2LhEbQajrj\npQfSPt9NtNKxMSX96MLgIvbR2G7I+eRUgMb0Bj+fUEbEnq+CmO+CP3b5slXVLNVI\nHXvSSNtrwEIex+3TuYTMIc9B\n-----END PRIVATE KEY-----\n",
      "client_email": "feketerigo-iktato@alert-ability-434512-h1.iam.gserviceaccount.com",
      "client_id": "118345220069273630953",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/feketerigo-iktato%40alert-ability-434512-h1.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    };
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
