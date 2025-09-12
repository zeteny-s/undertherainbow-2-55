import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Newsletter } from '../../types/newsletter-types';

// Import decorative assets
import decoration1 from '../../assets/decoration-1.png';
import decoration2 from '../../assets/decoration-2.png';
import decoration3 from '../../assets/decoration-3.png';
import decoration4 from '../../assets/decoration-4.png';
import decoration5 from '../../assets/decoration-5.png';
import decoration6 from '../../assets/decoration-6.png';
import kindergartenLogo from '../../assets/kindergarten-logo.png';

interface PublicNewsletterPageProps {
  newsletterId?: string;
}

export const PublicNewsletterPage = ({ newsletterId }: PublicNewsletterPageProps) => {
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    if (newsletterId) {
      fetchNewsletter();
    }
  }, [newsletterId]);

  const fetchNewsletter = async () => {
    if (!newsletterId) return;

    try {
      setLoading(true);
      
      // Fetch newsletter data
      const { data: newsletterData, error: newsletterError } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', newsletterId)
        .single();

      if (newsletterError) throw newsletterError;
      setNewsletter(newsletterData as Newsletter);

      // Fetch associated forms
      const { data: formData, error: formError } = await supabase
        .from('newsletter_forms')
        .select(`
          form_id,
          forms (
            id,
            title,
            description
          )
        `)
        .eq('newsletter_id', newsletterId);

      if (formError) throw formError;
      setForms(formData?.map(item => item.forms) || []);

    } catch (error) {
      console.error('Error fetching newsletter:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Hírlevél nem található</h1>
          <p className="text-gray-600">A keresett hírlevél nem létezik vagy nem elérhető.</p>
        </div>
      </div>
    );
  }

  const appendFormsToNewsletter = (html: string) => {
    if (!forms || forms.length === 0) return html;

    const formsHtml = `
      <div style="margin-top: 48px; padding-top: 32px; border-top: 2px solid #e5e7eb;">
        <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 32px; text-align: center;">
          Available Forms & Programs
        </h2>
        ${forms.map((form, index) => `
          <div style="margin-bottom: ${index < forms.length - 1 ? '32px' : '0'}; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
            <h3 style="font-size: 20px; font-weight: 600; color: #3b82f6; margin-bottom: 12px;">
              ${form.title}
            </h3>
            ${form.description ? `
              <p style="color: #6b7280; margin-bottom: 16px; line-height: 1.6;">
                ${form.description}
              </p>
            ` : ''}
            <a href="/public-form/${form.id}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background-color 0.2s;">
              Fill out this form
            </a>
          </div>
          ${index < forms.length - 1 ? `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">` : ''}
        `).join('')}
      </div>
    `;

    return html + formsHtml;
  };

  const processedHtml = newsletter.generated_html ? appendFormsToNewsletter(newsletter.generated_html) : '';

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={decoration1} alt="" className="absolute top-10 left-10 w-16 h-16 opacity-20 animate-float" />
        <img src={decoration2} alt="" className="absolute top-20 right-20 w-20 h-20 opacity-15 animate-float-delayed" />
        <img src={decoration3} alt="" className="absolute bottom-32 left-16 w-14 h-14 opacity-25 animate-float" />
        <img src={decoration4} alt="" className="absolute bottom-20 right-12 w-18 h-18 opacity-20 animate-float-delayed" />
        <img src={decoration5} alt="" className="absolute top-1/2 left-8 w-12 h-12 opacity-15 animate-float" />
        <img src={decoration6} alt="" className="absolute top-1/3 right-6 w-16 h-16 opacity-20 animate-float-delayed" />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with logo */}
          <div className="text-center mb-8">
            <img 
              src={kindergartenLogo} 
              alt="Kindergarten Logo" 
              className="mx-auto mb-6 h-24 w-auto"
            />
          </div>

          {/* Newsletter card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Newsletter header */}
            <div className="bg-gradient-to-r from-primary to-primary-foreground text-white p-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{newsletter.title}</h1>
              {newsletter.description && (
                <p className="text-lg opacity-90">{newsletter.description}</p>
              )}
              <div className="mt-4 text-sm opacity-75">
                {newsletter.campus} • {new Date(newsletter.created_at).toLocaleDateString('hu-HU')}
              </div>
            </div>

            {/* Newsletter content */}
            <div className="p-8">
              {processedHtml ? (
                <div 
                  className="prose prose-lg max-w-none newsletter-content"
                  dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>A hírlevél tartalma még nem került generálásra.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-600">
            <p className="text-sm">
              © {new Date().getFullYear()} Kindergarten. Minden jog fenntartva.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 2s;
        }

        .newsletter-content h1,
        .newsletter-content h2,
        .newsletter-content h3 {
          color: #1f2937;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .newsletter-content h1 {
          font-size: 2rem;
          font-weight: 700;
        }

        .newsletter-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .newsletter-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .newsletter-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
          color: #374151;
        }

        .newsletter-content ul,
        .newsletter-content ol {
          margin: 1rem 0;
          padding-left: 2rem;
          color: #374151;
        }

        .newsletter-content li {
          margin-bottom: 0.5rem;
        }

        .newsletter-content a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .newsletter-content a:hover {
          color: #1d4ed8;
        }

        .newsletter-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};