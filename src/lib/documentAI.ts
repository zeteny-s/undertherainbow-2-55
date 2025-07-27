interface DocumentAIResponse {
  document: {
    text: string;
    pages: Array<{
      pageNumber: number;
      dimension: {
        width: number;
        height: number;
        unit: string;
      };
      blocks: Array<{
        layout: {
          textAnchor: {
            textSegments: Array<{
              startIndex: string;
              endIndex: string;
            }>;
          };
          confidence: number;
          boundingPoly: {
            vertices: Array<{
              x: number;
              y: number;
            }>;
          };
        };
      }>;
      paragraphs: Array<{
        layout: {
          textAnchor: {
            textSegments: Array<{
              startIndex: string;
              endIndex: string;
            }>;
          };
          confidence: number;
        };
      }>;
      lines: Array<{
        layout: {
          textAnchor: {
            textSegments: Array<{
              startIndex: string;
              endIndex: string;
            }>;
          };
          confidence: number;
        };
      }>;
      tokens: Array<{
        layout: {
          textAnchor: {
            textSegments: Array<{
              startIndex: string;
              endIndex: string;
            }>;
          };
          confidence: number;
        };
      }>;
    }>;
  };
}

export async function processDocumentWithAI(fileBase64: string, mimeType: string): Promise<string> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://xtovmknldanpipgddsrd.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0b3Zta25sZGFucGlwZ2Rkc3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODIyNjYsImV4cCI6MjA2NTg1ODI2Nn0.S2Nr8XrHmFkDlI_LrUrXhA_2h4qczAQ1nb6EE8sDC5k'
    );

    const { data, error } = await supabase.functions.invoke('process-document', {
      body: {
        document: {
          content: fileBase64,
          mimeType: mimeType,
        },
      },
    });

    if (error) {
      throw new Error(`Document AI API error: ${error.message}`);
    }

    // Check if the response contains an error
    if (data?.error) {
      throw new Error(`Document AI processing failed: ${data.error.message || 'Unknown error'}`);
    }

    // Check if response has the expected structure
    if (!data?.document?.text) {
      throw new Error('Invalid response from Document AI: missing document text');
    }

    const result: DocumentAIResponse = data;
    return result.document.text;
  } catch (error) {
    console.error('Error processing document with AI:', error);
    throw error;
  }
}

export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}