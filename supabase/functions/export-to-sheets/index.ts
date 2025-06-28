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
    const { invoiceData, organization } = await req.json()
    
    const serviceAccountKey = {
      "type": "service_account",
      "project_id": "alert-ability-434512-h1",
      "private_key_id": "59fad2f0351d1f1b46e99c7466aee6a6240be8ec",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCpdqcUnw3g4BTS\nszF45gy+V+Ffj8EtupxdIF0QA/tOU7EeD401JZ+DLhXPuQ1sW4ZcWKlDVPgzMs/t\nGqiYTPEMNSjDN2ZFc6eXg9E5XR2v7O0LQIsywRFBzfcIzvEyV25M73RfYAUj1Vrs\nMMoqeWEds+OLhzJBaTkwKI+RMuYgdpTXDGLCjP15WQcHyLtBR5MWuQEWFOQS2Grs\nlJtkZ2u26UlK/7p2eGVfkRQT6FBxKD79ABcRSvU+6I5vf2ZIXHT6rCZNnO35wyFc\nIUcE29sjBta2Ke00Jw2rkdtG0Rexv7fVvRf+4kxhFc4AzpHJCWemS4ITRXxbpzFQ\ni+n6LuR3AgMBAAECggEAFKIxgSLwrKh8Feo4TtvWl2KEkCnPwAKlwU0MfRkPA0rQ\nw7Ppt0aSdTAqUGAxezfAVK7S794rrl2J0E6GUqz4+J83DGCgH5APyt9Y8p7HhkEs\nh580k68gVnPT7WBNIUULVWtz2Z0LuIDk5jdL66oFzM5iGVNn0hZpc9dXIRB30WHh\nZY+tHlxoRb2OM46zDzRiEFJ4zPpNP7E0Id9Z1k9VAXjKpybXW+UZDHyghxPmH7G2\ni5HhWb7RHw3eP/Glokf/aNJN3x1GzcyjCnDtlrogx+EPmv++05Rd+rJUowzfoqIK\nhPekXOv0Tp69h92h/XmfHfduiTSn81uxwKOQK1sdiQKBgQDcjMgYhsv9XEFdaHPw\nnveH8HeK4QwEE3AKWm0B00+KWaYIVt5Rj7A8h7FL4W576mkFOT7/4U/sTiJTkqd0\nsIL4VB04AZws1Ut59hQ0h8L6/h6R6pUljsTd7Qu+zNHP/ZLLJhxLjwoIQQTYYSoX\nlUBP94nkM4ZTU8v28rim06twGwKBgQDEs8Jb++fMfV0sqUIfJoydlvkabcibv++Y\nikIAaOEFfpHhrxi4flo9QqxdlAsnMTDUUw8+ZzAEOopzyAaiyuG4bKDU3Ts4aJK0\nKiJqistcaAxggwMdJ4AD3YatkbMjqPUTjtMtaXjF/oodrItymy+jYP6Trwezyyil\n3G4lvrW61QKBgCvo+42miMaQr5LhUPP/MlkmTyafV70YAZ6OElXitFtfLedLJEgo\ny3XBrlLlNxIEwZQAqcJYIYlypPLup9hbrDe0x3x3FZj3fmdxzuQGg5NlNMDoa3lm\ny1tD7qq2LK+0VJ2NoOSKPf0WtNg/wBmh5YQGTLXabEv6ywkHmivcyK0xAoGAbpC0\ngUvZgaI+C2qgli3vAG3qW6a2CoYawV2FuAE76wC4M2leteWgB6tAg+FBW6hU0CRX\n/zW1UcsuI+KdiEgOFMJKrRwlu5FcVRUR/11A7hI2UtGRoIOhe4q7tzicv0CrcXDo\n1y/gCTsIm6FvSN5eKrHMp2rNI4zgrkp3R5QpRnkCgYEAhxSH9wixALB7AvQqJ/gn\n7Gj81exta+UGFuSy4O8f539vn/q6Z1KB6x98bLEXyblK8bUksAnZ8pWoJtVredEB\noWUpNlBjfxDjNkQaTpAOID2QhWiu4X2QfnP4KmOjGpARVPcGZOlp7DyNgmdhe5Ti\n8D0zrTvVu2FWb2R7E7NrPaI=\n-----END PRIVATE KEY-----\n",
      "client_email": "feketerigo-iktato@alert-ability-434512-h1.iam.gserviceaccount.com",
      "client_id": "118345220069273630953",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/feketerigo-iktato%40alert-ability-434512-h1.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    }

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await createJWT(serviceAccountKey),
      }),
    })

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Determine which sheet to use based on payment type
    const sheetName = invoiceData.paymentType === 'bank_transfer' ? 'Átutalásos' : 'KP'
    const spreadsheetId = '1mF8EhC7BFSfxSKlvVvvYcJP8UDFSjWDucO2bCQeK1b8'

    // Prepare row data based on payment type
    let rowData
    if (invoiceData.paymentType === 'bank_transfer') {
      // Átutalásos sheet: Szervezet, Partner, Bankszámlaszám, Munkaszám, Tárgy, Számla sorszáma, Összeg, Számla kelte, Fizetési határidő
      rowData = [
        organization === 'alapitvany' ? 'Feketerigó Alapítvány' : 'Feketerigó Alapítványi Óvoda',
        invoiceData.Partner || '',
        invoiceData.Bankszámlaszám || '',
        invoiceData.Munkaszám || '',
        invoiceData.Tárgy || '',
        invoiceData['Számla sorszáma'] || '',
        invoiceData.Összeg || '',
        invoiceData['Számla kelte'] || '',
        invoiceData['Fizetési határidő'] || ''
      ]
    } else {
      // KP sheet: Szervezet, Partner, Tárgy, Számla sorszáma, Összeg, Számla kelte, MUNKASZÁM
      rowData = [
        organization === 'alapitvany' ? 'Feketerigó Alapítvány' : 'Feketerigó Alapítványi Óvoda',
        invoiceData.Partner || '',
        invoiceData.Tárgy || '',
        invoiceData['Számla sorszáma'] || '',
        invoiceData.Összeg || '',
        invoiceData['Számla kelte'] || '',
        invoiceData.Munkaszám || ''
      ]
    }

    // Add to Google Sheets
    const range = `${sheetName}!A:Z`
    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowData],
        }),
      }
    )

    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text()
      throw new Error(`Google Sheets API error: ${sheetsResponse.statusText} - ${errorText}`)
    }

    const sheetsResult = await sheetsResponse.json()

    return new Response(
      JSON.stringify({ success: true, result: sheetsResult }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Google Sheets export error:', error)
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function createJWT(serviceAccount: any) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const signatureInput = `${encodedHeader}.${encodedPayload}`
  
  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  )

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${signatureInput}.${encodedSignature}`
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '')
  const binaryString = atob(pemContents)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}