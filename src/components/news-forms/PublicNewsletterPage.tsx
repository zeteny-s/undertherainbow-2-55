import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

export const PublicNewsletterPage = () => {
  const { newsletterId } = useParams<{ newsletterId: string }>();
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
        .maybeSingle();

      if (newsletterError) throw newsletterError;
      
      if (!newsletterData) {
        setNewsletter(null);
        setLoading(false);
        return;
      }
      
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

  const decorationImages = [decoration1, decoration2, decoration3, decoration4, decoration5, decoration6];

  return (
    <div className="h-full overflow-y-auto bg-white relative z-20" style={{
      background: `radial-gradient(circle at 20% 30%, rgba(125, 211, 192, 0.15) 0%, transparent 50%),
                   radial-gradient(circle at 80% 20%, rgba(107, 199, 181, 0.12) 0%, transparent 40%),
                   radial-gradient(circle at 40% 70%, rgba(125, 211, 192, 0.1) 0%, transparent 60%),
                   radial-gradient(circle at 90% 80%, rgba(107, 199, 181, 0.08) 0%, transparent 45%),
                   radial-gradient(circle at 10% 90%, rgba(125, 211, 192, 0.13) 0%, transparent 55%),
                   radial-gradient(circle at 60% 10%, rgba(107, 199, 181, 0.11) 0%, transparent 50%)`
    }}>
      {/* Background decorative images */}
      {decorationImages.map((img, index) => {
        const positions = [
          { top: '8%', left: '5%', transform: 'rotate(-15deg)', width: '120px' },
          { top: '15%', right: '8%', transform: 'rotate(25deg)', width: '90px' },
          { top: '35%', left: '12%', transform: 'rotate(45deg)', width: '80px' },
          { top: '55%', right: '15%', transform: 'rotate(-30deg)', width: '110px' },
          { top: '75%', left: '20%', transform: 'rotate(60deg)', width: '70px' },
          { top: '12%', left: '35%', transform: 'rotate(-45deg)', width: '130px' }
        ];
        const pos = positions[index % positions.length];
        return (
          <img
            key={index}
            src={img}
            alt=""
            className="absolute opacity-20 pointer-events-none z-0"
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              right: pos.right,
              transform: pos.transform,
              width: pos.width,
              opacity: 0.2
            }}
          />
        );
      })}

      <div className="relative z-30 max-w-4xl mx-auto px-5 py-10 min-h-screen flex flex-col justify-center items-center">
        <div className="bg-white rounded-3xl shadow-2xl p-16 relative w-full max-w-3xl z-40 border border-gray-200">
          {/* Logo */}
          <div className="text-center mb-8 relative z-50">
            <img 
              src={kindergartenLogo} 
              alt="Under the Rainbow Kindergarten and Nursery" 
              className="max-w-full h-auto mx-auto mb-6"
              style={{ maxWidth: '300px' }}
            />
          </div>

          {/* Newsletter Content */}
          <div className="space-y-6 relative z-50">
            {newsletter.generated_html ? (
              <div dangerouslySetInnerHTML={{ __html: newsletter.generated_html }} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>A hírlevél tartalma még nem került generálásra.</p>
              </div>
            )}
          </div>

          {/* Selected Forms Section */}
          {forms && forms.length > 0 && (
            <div className="border-t pt-6 mt-8 relative z-50">
              <h3 className="text-lg font-semibold text-center mb-4">Forms & Programs</h3>
              <div className="space-y-4">
                {forms.map((form) => (
                  <div key={form.id} className="bg-muted/30 rounded-lg p-4 border">
                    <h4 className="font-medium text-sm mb-1">{form.title}</h4>
                    {form.description && (
                      <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{form.description}</p>
                    )}
                    <a 
                      href={`/news-forms/public/${form.id}`}
                      className="inline-flex items-center gap-1 text-xs h-8 px-3 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open Form
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};