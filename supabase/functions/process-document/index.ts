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
    const { document } = await req.json()
    
    const serviceAccountKey = {
      "type": "service_account",
      "project_id": "alert-ability-434512-h1",
      "private_key_id": "99f342d1d16ebe165f61abdbfe89c6dcef0d5b03",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCmvfSVepGsgfDk\n+hGs1O2ycZLzorgQJ9+L6tj61XPTaFlQKssOb6YOHD662WoFmeNH2S0N3Afu5X1T\nYoVF/5RMhSen2Ej4stcXr5skVxwidiJZOMrQ5xKypLkNCxMjxk5/vlgOJWW8OrBB\n/eWrnXVrppgE7XGozHFtHZ1sX0ft+QXjtEvVIeCr4DUrc+sTg6aEQI71oPTmViSF\nsnIk/vCifQKhnH+Q+uBhOT/3b1HiOizSRwodsUOmjm/f+HmLLkYsRES6sVqNRzqb\nnEfCRAQzi2D75nsaycS7T59VPoUlkKznYxwkqJcihp1PTW41BIuf+JODNzupbsmB\np1tY+fM5AgMBAAECggEAAtVH+lV+5/kCso5k08MLhcurUXLO+xl5nP7oFi6fkDG9\n+UvrBsnbxLf43lgRXHfpXYdur4slRYs9mIkzjZm+NLB1ak7D2Y3vopRk0IgTeAfi\nvJ0ta5MUc/qbnw00fCPDc7DALKJy8fyhS7Cp4+Yk6/k+w9MIR3PeMeAplFKificQ\noIjp/RPHeO/khPE2T0Zc5sgvqkk5z+lJK4gODVEQ2kqT4J9uO/B87J5Uu6N//VUi\nS3MyYPBWCiQKMnU2fWKb4JbhUjKYpk6lg5O1lQWyBkWY8ufKFm2xyEJ49rdxV+0z\nYKfFNTkDNiGVsMpnAK32Ox6/7whs3BzLrzHQa8K5cQKBgQDjhVZNzoCYIHCr+EE6\nUD+/UIPcom229lwu1LRTM3ey1EHeclwI2HHqO9/yMTKlTVcJZ+x3xkRi7CO+aWyH\n2l1HFWlwpnFFB5D0ojIroJZVR/B2ZQY2MxtMl5fK/tqPmS8EDbpcpQW5aibM2B1I\nsiJrfIcV4jKqGjZPCvRwjdVR/QKBgQC7nQZ9jsLY5rRGRoIiiHdWpcmNNABJcUfw\nR1Bk5JB2BvVRjbB0xpSs/lVLO0jG5BborbR1bU9ktFZtLIfBW8t127kDMKFS0oNM\nYYGV3wHl7475RU1YmueKJQn0oDK/YAhedal9dQ1Va92by7Syq2/TMBzrFrR2xJK1\nBtrMa2j87QKBgFcAtPj533jM5ukL/L101HuvKU1km3nciXGrCu3J/5rVyf5rUsBb\nLGx6yu9NWuWVRpQlNmqy2ZHOZPi6TbNBkGvPR0u5ihTwiMDTiUXfmb0wzkYn6ZEu\nR+EpEvWgMSm6VR1CtqIYxLCbZAzvE3uqCrl5nBqFLgSYE250bPbhddJtAoGAG/6T\nQFr0Ag9yqOXOdz6rp/c2+uXegRbxKA5MFbHxSFtDcbbVtKcI+kM9EOu4sUzJilCZ\nE8iKxzkNiF7Tput+kYiGs84m1EfrJZOLFYTgMKItUE6h+u2qTPe345Of3uSCey3N\na5XytmNQ/vVHcj2Ygwez2PRbWzl7tp1eOpBwawUCgYEA375wPH3sjIEnw3vUGssN\nf6U37b+tbzLGBFHlkTab8XYUxdLIrFrg6aQNl+r4T8ghW3tm/T47KLRYdjDHM6yo\nkeicrT1vqo5w/1dF3S4KFr77CaeaPiXtrNDYcHTv/P3jb+S0lr1au7tDZ2IBByPO\nGjXg0geMqFWNxMyac+rbdas=\n-----END PRIVATE KEY-----\n",
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

    // Process document with Document AI
    const response = await fetch(
      'https://eu-documentai.googleapis.com/v1/projects/450340369741/locations/eu/processors/f35e912f88693cf9:process',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawDocument: {
            content: document.content,
            mimeType: document.mimeType,
          },
        }),
      }
    )

    const result = await response.json()

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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
    scope: 'https://www.googleapis.com/auth/cloud-platform',
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