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
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        document: {
          content: fileBase64,
          mimeType: mimeType,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Document AI API error: ${response.statusText}`);
    }

    const result: DocumentAIResponse = await response.json();
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
