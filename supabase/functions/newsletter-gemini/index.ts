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
      `- ${form.title}: ${form.description || 'No description available'}`
    ).join('\n');

    const imageInfo = requestData.imageUrls.length > 0 
      ? `\n\nUploaded images: ${requestData.imageUrls.length} images available for the newsletter.`
      : '';

    const languageInstruction = requestData.contentGuidelines?.toLowerCase().includes('hungarian') || 
                                requestData.contentGuidelines?.toLowerCase().includes('magyar') ? 
                                'Use Hungarian language' : 'Use English language';

    const prompt = `
Create a professional, friendly newsletter content in HTML format based on the following information:

Title: ${requestData.title}
Campus: ${requestData.campus}
Content Guidelines: ${requestData.contentGuidelines || 'Create an informative and engaging newsletter'}

Available forms/programs:
${formsInfo}
${imageInfo}

IMPORTANT REQUIREMENTS:
1. Wrap the HTML content in div tags, but DO NOT add full HTML document structure (head, body etc.)
2. Use inline CSS styles for formatting
3. Content should be responsive and modern
4. Use colors: primary color #3b82f6 (blue), secondary #6b7280 (gray)
5. DO NOT generate form buttons - these will be automatically added
6. Content should be informative and engaging for parents
7. Mention the campus and available programs/forms
8. ${languageInstruction}
9. HTML should be clean and well-structured
10. Create engaging content that parents would want to read

Respond with only the HTML content, nothing else.
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