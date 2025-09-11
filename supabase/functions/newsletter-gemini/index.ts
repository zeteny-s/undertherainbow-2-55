import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API');

if (!geminiApiKey) {
  throw new Error('GEMINI_API environment variable is required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, campus, contentGuidelines, selectedForms, imageUrls, newsletterId, action } = await req.json();

    console.log('Newsletter generation request:', { title, campus, formCount: selectedForms?.length, action });

    let requestData;
    
    if (action === 'regenerate' && newsletterId) {
      // Fetch existing newsletter data for regeneration
      const { data: newsletter, error: newsletterError } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', newsletterId)
        .single();

      if (newsletterError) {
        throw new Error(`Failed to fetch newsletter: ${newsletterError.message}`);
      }

      // Fetch associated forms
      const { data: formData, error: formError } = await supabase
        .from('newsletter_forms')
        .select(`
          form_id,
          forms (
            id,
            title,
            description,
            campus
          )
        `)
        .eq('newsletter_id', newsletterId);

      if (formError) {
        throw new Error(`Failed to fetch forms: ${formError.message}`);
      }

      // Fetch images
      const { data: imageData, error: imageError } = await supabase
        .from('newsletter_images')
        .select('image_url')
        .eq('newsletter_id', newsletterId);

      if (imageError) {
        throw new Error(`Failed to fetch images: ${imageError.message}`);
      }

      requestData = {
        title: newsletter.title,
        campus: newsletter.campus,
        contentGuidelines: newsletter.content_guidelines || '',
        selectedForms: formData?.map(item => item.forms) || [],
        imageUrls: imageData?.map(img => img.image_url) || []
      };
    } else {
      requestData = { title, campus, contentGuidelines, selectedForms, imageUrls };
    }

    // Prepare the prompt for Gemini
    const formsInfo = requestData.selectedForms.map((form: any) => 
      `- ${form.title}: ${form.description || 'Nincs leírás'}`
    ).join('\n');

    const imageInfo = requestData.imageUrls.length > 0 
      ? `\n\nFeltöltött képek: ${requestData.imageUrls.length} kép elérhető a hírlevélhez.`
      : '';

    const prompt = `
Készíts egy professzionális, barátságos hangvételű hírlevél tartalmat HTML formátumban a következő információk alapján:

Cím: ${requestData.title}
Telephely: ${requestData.campus}
Tartalom irányelvek: ${requestData.contentGuidelines || 'Készíts egy informatív és vonzó hírlevelelet'}

Elérhető űrlapok:
${formsInfo}
${imageInfo}

FONTOS KÖVETELMÉNYEK:
1. A HTML tartalmat wrap-eld div tag-ekkel, de NE adj hozzá teljes HTML dokumentum struktúrát (head, body stb.)
2. Használj inline CSS stílusokat a formázáshoz
3. A tartalom legyen responsive és modern
4. Használj színeket: elsődleges szín #3b82f6 (kék), másodlagos #6b7280 (szürke)
5. NE generálj űrlap gombokat - ezeket automatikusan hozzáadjuk
6. A tartalom legyen informatív és vonzó a szülők számára
7. Említsd meg a telephelyet és az elérhető programokat/űrlapokat
8. Használj magyar nyelvet
9. A HTML legyen clean és jól strukturált

Válaszolj csak a HTML tartalommal, semmi mással.
    `;

    console.log('Sending request to Gemini API...');

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }

    const generatedContent = data.candidates[0].content.parts[0].text;
    
    // Clean up the generated HTML
    let generatedHtml = generatedContent
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();

    // If regenerating, update the existing newsletter
    if (action === 'regenerate' && newsletterId) {
      const { error: updateError } = await supabase
        .from('newsletters')
        .update({ generated_html: generatedHtml })
        .eq('id', newsletterId);

      if (updateError) {
        console.error('Error updating newsletter:', updateError);
        throw new Error(`Failed to update newsletter: ${updateError.message}`);
      }

      console.log('Newsletter content regenerated successfully');
    }

    return new Response(
      JSON.stringify({ 
        generatedHtml,
        message: action === 'regenerate' ? 'Content regenerated successfully' : 'Content generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in newsletter-gemini function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while generating newsletter content',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});