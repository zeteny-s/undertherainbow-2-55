import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvoiceRecord {
  id: string;
  file_name: string;
  file_url: string;
  organization: string;
  uploaded_at: string;
  processed_at: string;
  status: string;
  partner: string;
  bank_account: string;
  subject: string;
  invoice_number: string;
  amount: number;
  invoice_date: string;
  payment_deadline: string;
  payment_method: string;
  invoice_type: string;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting automated backup process...')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate date range for last 2 weeks
    const now = new Date()
    const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000))
    
    console.log(`Fetching invoices from ${twoWeeksAgo.toISOString()} to ${now.toISOString()}`)

    // Fetch invoices from the last 2 weeks
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .gte('uploaded_at', twoWeeksAgo.toISOString())
      .lte('uploaded_at', now.toISOString())
      .order('uploaded_at', { ascending: false })

    if (fetchError) {
      throw new Error(`Failed to fetch invoices: ${fetchError.message}`)
    }

    console.log(`Found ${invoices?.length || 0} invoices to backup`)

    if (!invoices || invoices.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No invoices found in the last 2 weeks',
          invoiceCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Download all invoice files
    const fileData: Array<{ filename: string; data: Uint8Array }> = []
    
    for (const invoice of invoices) {
      if (invoice.file_url) {
        try {
          console.log(`Downloading file: ${invoice.file_name}`)
          
          // Extract file path from URL
          const url = new URL(invoice.file_url)
          const pathParts = url.pathname.split('/')
          const bucketIndex = pathParts.findIndex(part => part === 'invoices')
          
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/')
            
            // Download file from Supabase Storage
            const { data: fileBlob, error: downloadError } = await supabase.storage
              .from('invoices')
              .download(filePath)

            if (downloadError) {
              console.warn(`Failed to download ${invoice.file_name}: ${downloadError.message}`)
              continue
            }

            if (fileBlob) {
              const arrayBuffer = await fileBlob.arrayBuffer()
              const uint8Array = new Uint8Array(arrayBuffer)
              
              // Create safe filename
              const safeFilename = invoice.file_name.replace(/[^a-zA-Z0-9.-]/g, '_')
              
              fileData.push({
                filename: `invoices/${safeFilename}`,
                data: uint8Array
              })
            }
          }
        } catch (error) {
          console.warn(`Error downloading ${invoice.file_name}:`, error)
        }
      }
    }

    console.log(`Successfully downloaded ${fileData.length} files`)

    // Create metadata JSON
    const metadata = {
      backup_date: now.toISOString(),
      backup_period: {
        start: twoWeeksAgo.toISOString(),
        end: now.toISOString()
      },
      total_invoices: invoices.length,
      total_files_downloaded: fileData.length,
      invoices: invoices.map((invoice: InvoiceRecord) => ({
        id: invoice.id,
        file_name: invoice.file_name,
        organization: invoice.organization,
        upload_timestamp: invoice.uploaded_at,
        processing_timestamp: invoice.processed_at,
        status: invoice.status,
        payment_type: invoice.invoice_type,
        partner: invoice.partner,
        bank_account: invoice.bank_account,
        subject: invoice.subject,
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        invoice_date: invoice.invoice_date,
        payment_deadline: invoice.payment_deadline,
        payment_method: invoice.payment_method,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at
      }))
    }

    const metadataJson = JSON.stringify(metadata, null, 2)
    const metadataBytes = new TextEncoder().encode(metadataJson)

    // Create ZIP file
    const zipData = await createZipFile([
      ...fileData,
      { filename: 'metadata.json', data: metadataBytes }
    ])

    // Upload to Google Drive
    const backupFilename = `backup_${now.toISOString().split('T')[0]}.zip`
    const driveUploadResult = await uploadToGoogleDrive(zipData, backupFilename)

    console.log('Backup completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup completed successfully',
        backup_filename: backupFilename,
        invoice_count: invoices.length,
        files_downloaded: fileData.length,
        backup_size_mb: (zipData.length / 1024 / 1024).toFixed(2),
        google_drive_file_id: driveUploadResult.fileId,
        backup_date: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Backup process failed:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Create ZIP file using basic ZIP format
async function createZipFile(files: Array<{ filename: string; data: Uint8Array }>): Promise<Uint8Array> {
  // Simple ZIP implementation for Deno
  // This creates a basic ZIP file structure
  
  const zipParts: Uint8Array[] = []
  const centralDirectory: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    // Local file header
    const filename = new TextEncoder().encode(file.filename)
    const localHeader = new Uint8Array(30 + filename.length)
    const view = new DataView(localHeader.buffer)
    
    // Local file header signature
    view.setUint32(0, 0x04034b50, true)
    // Version needed to extract
    view.setUint16(4, 20, true)
    // General purpose bit flag
    view.setUint16(6, 0, true)
    // Compression method (0 = no compression)
    view.setUint16(8, 0, true)
    // File last modification time
    view.setUint16(10, 0, true)
    // File last modification date
    view.setUint16(12, 0, true)
    // CRC-32
    view.setUint32(14, calculateCRC32(file.data), true)
    // Compressed size
    view.setUint32(18, file.data.length, true)
    // Uncompressed size
    view.setUint32(22, file.data.length, true)
    // File name length
    view.setUint16(26, filename.length, true)
    // Extra field length
    view.setUint16(28, 0, true)
    
    // Copy filename
    localHeader.set(filename, 30)
    
    zipParts.push(localHeader)
    zipParts.push(file.data)
    
    // Central directory entry
    const centralEntry = new Uint8Array(46 + filename.length)
    const centralView = new DataView(centralEntry.buffer)
    
    // Central file header signature
    centralView.setUint32(0, 0x02014b50, true)
    // Version made by
    centralView.setUint16(4, 20, true)
    // Version needed to extract
    centralView.setUint16(6, 20, true)
    // General purpose bit flag
    centralView.setUint16(8, 0, true)
    // Compression method
    centralView.setUint16(10, 0, true)
    // File last modification time
    centralView.setUint16(12, 0, true)
    // File last modification date
    centralView.setUint16(14, 0, true)
    // CRC-32
    centralView.setUint32(16, calculateCRC32(file.data), true)
    // Compressed size
    centralView.setUint32(20, file.data.length, true)
    // Uncompressed size
    centralView.setUint32(24, file.data.length, true)
    // File name length
    centralView.setUint16(28, filename.length, true)
    // Extra field length
    centralView.setUint16(30, 0, true)
    // File comment length
    centralView.setUint16(32, 0, true)
    // Disk number start
    centralView.setUint16(34, 0, true)
    // Internal file attributes
    centralView.setUint16(36, 0, true)
    // External file attributes
    centralView.setUint32(38, 0, true)
    // Relative offset of local header
    centralView.setUint32(42, offset, true)
    
    // Copy filename
    centralEntry.set(filename, 46)
    
    centralDirectory.push(centralEntry)
    
    offset += localHeader.length + file.data.length
  }

  // Calculate central directory size
  const centralDirSize = centralDirectory.reduce((sum, entry) => sum + entry.length, 0)
  
  // End of central directory record
  const endRecord = new Uint8Array(22)
  const endView = new DataView(endRecord.buffer)
  
  // End of central dir signature
  endView.setUint32(0, 0x06054b50, true)
  // Number of this disk
  endView.setUint16(4, 0, true)
  // Number of the disk with the start of the central directory
  endView.setUint16(6, 0, true)
  // Total number of entries in the central directory on this disk
  endView.setUint16(8, files.length, true)
  // Total number of entries in the central directory
  endView.setUint16(10, files.length, true)
  // Size of the central directory
  endView.setUint32(12, centralDirSize, true)
  // Offset of start of central directory
  endView.setUint32(16, offset, true)
  // ZIP file comment length
  endView.setUint16(20, 0, true)

  // Combine all parts
  const totalSize = zipParts.reduce((sum, part) => sum + part.length, 0) + centralDirSize + endRecord.length
  const result = new Uint8Array(totalSize)
  
  let pos = 0
  for (const part of zipParts) {
    result.set(part, pos)
    pos += part.length
  }
  
  for (const entry of centralDirectory) {
    result.set(entry, pos)
    pos += entry.length
  }
  
  result.set(endRecord, pos)
  
  return result
}

// Simple CRC32 calculation
function calculateCRC32(data: Uint8Array): number {
  const crcTable = new Uint32Array(256)
  
  // Generate CRC table
  for (let i = 0; i < 256; i++) {
    let crc = i
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1)
    }
    crcTable[i] = crc
  }
  
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8)
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// Upload to Google Drive
async function uploadToGoogleDrive(zipData: Uint8Array, filename: string): Promise<{ fileId: string }> {
  // Google OAuth credentials
  const clientId = '450340369741-hl64tqoj060d8ng6tv10lononmkd48o3.apps.googleusercontent.com'
  const clientSecret = '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'
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN')
  
  if (!refreshToken) {
    throw new Error('Google refresh token not found in environment variables')
  }

  // Get access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.statusText}`)
  }

  const tokenData = await tokenResponse.json()
  const accessToken = tokenData.access_token

  // Upload file to Google Drive
  const folderId = '1Lg6LG-UBYGvb4_idZclOMc6JgHgLRdrR'
  
  // Create file metadata
  const metadata = {
    name: filename,
    parents: [folderId]
  }

  // Create multipart upload
  const boundary = '-------314159265358979323846'
  const delimiter = `\r\n--${boundary}\r\n`
  const close_delim = `\r\n--${boundary}--`

  const metadataPart = delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata)

  const dataPart = delimiter +
    'Content-Type: application/zip\r\n\r\n'

  const multipartRequestBody = new Uint8Array(
    new TextEncoder().encode(metadataPart + dataPart).length +
    zipData.length +
    new TextEncoder().encode(close_delim).length
  )

  let offset = 0
  const metadataBytes = new TextEncoder().encode(metadataPart + dataPart)
  multipartRequestBody.set(metadataBytes, offset)
  offset += metadataBytes.length

  multipartRequestBody.set(zipData, offset)
  offset += zipData.length

  const closeBytes = new TextEncoder().encode(close_delim)
  multipartRequestBody.set(closeBytes, offset)

  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody,
    }
  )

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    throw new Error(`Google Drive upload failed: ${uploadResponse.statusText} - ${errorText}`)
  }

  const uploadResult = await uploadResponse.json()
  
  return { fileId: uploadResult.id }
}