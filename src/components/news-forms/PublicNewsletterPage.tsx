import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Newsletter } from '../../types/newsletter-types';
import type { NewsletterComponent } from '../../types/newsletter-builder-types';
import { ExternalLink } from 'lucide-react';

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
  const [components, setComponents] = useState<NewsletterComponent[]>([]);

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

      // Parse components from JSON if available
      if (newsletterData.components && Array.isArray(newsletterData.components)) {
        const sortedComponents = (newsletterData.components as unknown as NewsletterComponent[])
          .sort((a, b) => a.position - b.position);
        setComponents(sortedComponents);
      }

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
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="fixed inset-0 bg-white">
          <div className="absolute inset-0" 
               style={{
                 background: `radial-gradient(circle at 20% 30%, rgba(125, 211, 192, 0.15) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(107, 199, 181, 0.12) 0%, transparent 40%),
                             radial-gradient(circle at 40% 70%, rgba(125, 211, 192, 0.1) 0%, transparent 60%),
                             radial-gradient(circle at 90% 80%, rgba(107, 199, 181, 0.08) 0%, transparent 45%),
                             radial-gradient(circle at 10% 90%, rgba(125, 211, 192, 0.13) 0%, transparent 55%),
                             radial-gradient(circle at 60% 10%, rgba(107, 199, 181, 0.11) 0%, transparent 50%)`
               }} />
        </div>
        <div className="relative z-10">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="fixed inset-0 bg-white">
          <div className="absolute inset-0" 
               style={{
                 background: `radial-gradient(circle at 20% 30%, rgba(125, 211, 192, 0.15) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(107, 199, 181, 0.12) 0%, transparent 40%),
                             radial-gradient(circle at 40% 70%, rgba(125, 211, 192, 0.1) 0%, transparent 60%),
                             radial-gradient(circle at 90% 80%, rgba(107, 199, 181, 0.08) 0%, transparent 45%),
                             radial-gradient(circle at 10% 90%, rgba(125, 211, 192, 0.13) 0%, transparent 55%),
                             radial-gradient(circle at 60% 10%, rgba(107, 199, 181, 0.11) 0%, transparent 50%)`
               }} />
        </div>
        <div className="relative z-10 bg-white rounded-[30px] shadow-2xl p-16 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Hírlevél nem található</h2>
          <p className="text-gray-600">
            A keresett hírlevél nem létezik vagy nem elérhető.
          </p>
        </div>
      </div>
    );
  }

  const renderComponent = (component: NewsletterComponent) => {
    switch (component.type) {
      case 'heading':
        const heading = component.content;
        return React.createElement(`h${heading.level}`, {
          className: `font-bold mb-4 ${heading.textAlign === 'center' ? 'text-center' : heading.textAlign === 'right' ? 'text-right' : 'text-left'}`,
          style: { color: heading.color || 'inherit' }
        }, heading.text);
      
      case 'text-block':
        const textBlock = component.content;
        const processedContent = textBlock.content.replace(
          /<span[^>]*data-form-button="([^"]*)"[^>]*data-form-text="([^"]*)"[^>]*><\/span>/g,
          (_match: string, formId: string, buttonText: string) => {
            return `<a href="/news-forms/public/${formId}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #3b82f6; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: all 0.2s; margin: 0 4px;" onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">${buttonText}</a>`;
          }
        );
        
        return (
          <div 
            className="mb-4 newsletter-text-content"
            style={{ 
              textAlign: textBlock.textAlign || 'left'
            }}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        );
      
      case 'image':
        const image = component.content;
        return (
          <div className="mb-4 text-center">
            <img 
              src={image.url} 
              alt={image.alt}
              className="max-w-full h-auto rounded-lg"
              style={{ 
                width: image.width || 'auto',
                height: image.height || 'auto'
              }}
            />
          </div>
        );
      
      case 'button':
        const button = component.content;
        return (
          <div className="mb-4 text-center">
            <a
              href={button.url}
              className={`inline-flex items-center rounded-lg font-medium transition-all duration-200 hover:shadow-md ${
                button.size === 'small' ? 'px-4 py-2 text-sm' : 
                button.size === 'large' ? 'px-8 py-4 text-lg' : 'px-6 py-3'
              } ${
                button.buttonStyle === 'outline' 
                  ? 'border-2 bg-transparent hover:bg-opacity-10' 
                  : button.buttonStyle === 'secondary'
                  ? 'hover:bg-opacity-90'
                  : 'hover:opacity-90'
              }`}
              style={{
                backgroundColor: button.buttonStyle === 'outline' ? 'transparent' : 
                                button.buttonStyle === 'secondary' ? '#dfefe8' :
                                button.backgroundColor || '#3b82f6',
                color: button.buttonStyle === 'outline' ? (button.backgroundColor || '#3b82f6') :
                       button.buttonStyle === 'secondary' ? '#1f2937' :
                       button.textColor || '#ffffff',
                borderColor: button.buttonStyle === 'outline' ? (button.backgroundColor || '#3b82f6') : 'transparent',
                borderWidth: button.buttonStyle === 'outline' ? '2px' : '0'
              }}
            >
              {button.text}
            </a>
          </div>
        );
      
      case 'form-button':
        const formButton = component.content;
        if (!formButton.formId) {
          return null;
        }
        return (
          <div className="mb-4 text-center">
            <Link
              to={`/form/${formButton.formId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md ${
                formButton.size === 'small' ? 'px-4 py-2 text-sm' : 
                formButton.size === 'large' ? 'px-8 py-4 text-lg' : 'px-6 py-3'
              } ${
                formButton.buttonStyle === 'outline' 
                  ? 'border-2 bg-transparent hover:bg-opacity-10' 
                  : formButton.buttonStyle === 'secondary'
                  ? 'hover:bg-opacity-90'
                  : 'hover:opacity-90'
              }`}
              style={{
                backgroundColor: formButton.buttonStyle === 'outline' ? 'transparent' : 
                                formButton.buttonStyle === 'secondary' ? '#dfefe8' :
                                formButton.backgroundColor || '#3b82f6',
                color: formButton.buttonStyle === 'outline' ? (formButton.backgroundColor || '#3b82f6') :
                       formButton.buttonStyle === 'secondary' ? '#1f2937' :
                       formButton.textColor || '#ffffff',
                borderColor: formButton.buttonStyle === 'outline' ? (formButton.backgroundColor || '#3b82f6') : 'transparent',
                borderWidth: formButton.buttonStyle === 'outline' ? '2px' : '0'
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {formButton.text || 'Sign Up Now'}
            </Link>
          </div>
        );
      
      case 'divider':
        return <hr className="my-6 border-gray-300" />;
      
      case 'form-section':
        const formSection = component.content;
        const buttonAlignment = formSection.buttonPosition === 'center' ? 'justify-center' : 
                               formSection.buttonPosition === 'right' ? 'justify-end' : 'justify-start';
        const textAlignment = formSection.textAlign === 'center' ? 'text-center' : 
                             formSection.textAlign === 'right' ? 'text-right' : 'text-left';
        
        return (
          <div className="mb-8">
            <hr className="my-8 border-gray-300" />
            <div 
              className={`mb-6 ${textAlignment}`}
              style={{
                color: formSection.textColor || '#1f2937',
                padding: formSection.padding || '20px'
              }}
            >
              <h3 className={`font-semibold text-xl mb-3 ${textAlignment}`}>
                {formSection.title || 'Additional Infos & Sign Up Forms'}
              </h3>
              {formSection.description && (
                <p className={`text-sm mb-4 opacity-80 ${textAlignment}`}>{formSection.description}</p>
              )}
              {formSection.customMessage && (
                <p className={`text-sm mb-6 italic ${textAlignment}`}>{formSection.customMessage}</p>
              )}
              
              <div className="space-y-4">
                {forms && forms.length > 0 ? (
                  forms.map((form) => (
                    <div 
                      key={form.id} 
                      className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        backgroundColor: formSection.backgroundColor || '#ffffff',
                        borderRadius: formSection.borderRadius || '8px'
                      }}
                    >
                      <div className={textAlignment}>
                        <h4 className={`font-semibold text-base mb-2 ${textAlignment}`} style={{ color: formSection.textColor || '#1f2937' }}>
                          {form.title}
                        </h4>
                        {formSection.showDescription !== false && form.description && (
                          <p className={`text-sm opacity-70 mb-3 leading-relaxed ${textAlignment}`} style={{ color: formSection.textColor || '#1f2937' }}>
                            {form.description}
                          </p>
                        )}
                        <div className={`flex ${buttonAlignment} mt-4`}>
                          <Link
                            to={`/form/${form.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center px-4 py-2 rounded font-medium text-sm transition-all duration-200 hover:shadow-md ${
                              formSection.buttonStyle === 'outline' 
                                ? 'border-2 bg-transparent hover:bg-opacity-10' 
                                : formSection.buttonStyle === 'secondary'
                                ? 'hover:bg-opacity-90'
                                : 'hover:opacity-90'
                            }`}
                            style={{
                              backgroundColor: formSection.buttonStyle === 'outline' ? 'transparent' : 
                                              formSection.buttonStyle === 'secondary' ? '#dfefe8' :
                                              formSection.buttonBackgroundColor || '#3b82f6',
                              color: formSection.buttonStyle === 'outline' ? (formSection.buttonBackgroundColor || '#3b82f6') :
                                     formSection.buttonStyle === 'secondary' ? '#1f2937' :
                                     formSection.buttonTextColor || '#ffffff',
                              borderColor: formSection.buttonStyle === 'outline' ? (formSection.buttonBackgroundColor || '#3b82f6') : 'transparent',
                              borderWidth: formSection.buttonStyle === 'outline' ? '2px' : '0',
                              borderRadius: formSection.borderRadius || '8px'
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {formSection.buttonText || 'Open Form'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                    <p className="text-sm text-gray-500 font-medium">No forms available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-white">
        <div className="absolute inset-0" 
             style={{
               background: `radial-gradient(circle at 20% 30%, rgba(125, 211, 192, 0.15) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(107, 199, 181, 0.12) 0%, transparent 40%),
                           radial-gradient(circle at 40% 70%, rgba(125, 211, 192, 0.1) 0%, transparent 60%),
                           radial-gradient(circle at 90% 80%, rgba(107, 199, 181, 0.08) 0%, transparent 45%),
                           radial-gradient(circle at 10% 90%, rgba(125, 211, 192, 0.13) 0%, transparent 55%),
                           radial-gradient(circle at 60% 10%, rgba(107, 199, 181, 0.11) 0%, transparent 50%)`
             }} />
      </div>

      {/* Background decorative images - optimized for mobile */}
      <img src={decoration1} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[8%] left-[5%] -rotate-[15deg] w-[60px] md:w-[120px] hidden sm:block" />
      <img src={decoration2} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[15%] right-[8%] rotate-[25deg] w-[45px] md:w-[90px] hidden sm:block" />
      <img src={decoration3} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[35%] left-[12%] rotate-[45deg] w-[40px] md:w-[80px] hidden sm:block" />
      <img src={decoration4} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[55%] right-[15%] -rotate-[30deg] w-[55px] md:w-[110px] hidden sm:block" />
      <img src={decoration5} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[75%] left-[20%] rotate-[60deg] w-[35px] md:w-[70px] hidden sm:block" />
      <img src={decoration6} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[12%] left-[35%] -rotate-[45deg] w-[65px] md:w-[130px] hidden sm:block" />

      {/* Main container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 md:px-5 md:py-10 min-h-screen flex flex-col justify-center items-center">
        <div className="text-center bg-white rounded-2xl md:rounded-[30px] shadow-2xl p-8 md:p-16 relative w-full max-h-[85vh] overflow-y-auto">
          {/* Logo - properly centered */}
          <div className="flex justify-center mb-6 md:mb-8">
            <img 
              src={kindergartenLogo} 
              alt="Under the Rainbow Kindergarten and Nursery" 
              className="w-full max-w-[250px] md:max-w-[400px] h-auto"
            />
          </div>

          {/* Newsletter Content */}
          <div className="space-y-6">
            {components && components.length > 0 ? (
              <div className="space-y-4">
                {components.map((component) => (
                  <div key={component.id}>
                    {renderComponent(component)}
                  </div>
                ))}
              </div>
            ) : newsletter.generated_html && newsletter.generated_html.trim() !== '' && !newsletter.generated_html.includes('Add your content here...') ? (
              <div dangerouslySetInnerHTML={{ __html: newsletter.generated_html }} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>A hírlevél tartalma még nem került generálásra.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* EXACT COPY of rich text editor styles for consistent formatting */
        .newsletter-text-content * {
          /* Allow all inline styles to be preserved */
        }

        .newsletter-text-content ul,
        .newsletter-text-content ol {
          padding-left: 20px;
          margin: 12px 0;
        }

        .newsletter-text-content ul {
          list-style-type: disc;
        }

        .newsletter-text-content ol {
          list-style-type: decimal;
        }

        .newsletter-text-content li {
          margin: 6px 0;
          line-height: 1.6;
        }

        .newsletter-text-content p {
          margin: 12px 0;
          line-height: 1.6;
        }

        .newsletter-text-content h1, 
        .newsletter-text-content h2, 
        .newsletter-text-content h3, 
        .newsletter-text-content h4, 
        .newsletter-text-content h5, 
        .newsletter-text-content h6 {
          margin: 16px 0 12px 0;
          font-weight: bold;
          line-height: 1.3;
        }

        .newsletter-text-content h1 { font-size: 2em; }
        .newsletter-text-content h2 { font-size: 1.5em; }
        .newsletter-text-content h3 { font-size: 1.17em; }
        .newsletter-text-content h4 { font-size: 1em; }
        .newsletter-text-content h5 { font-size: 0.83em; }
        .newsletter-text-content h6 { font-size: 0.67em; }

        .newsletter-text-content strong, 
        .newsletter-text-content b {
          font-weight: bold;
        }

        .newsletter-text-content em, 
        .newsletter-text-content i {
          font-style: italic;
        }

        .newsletter-text-content u {
          text-decoration: underline;
        }

        .newsletter-text-content blockquote {
          margin: 16px 0;
          padding: 12px 16px;
          border-left: 4px solid #e2e8f0;
          background-color: #f8fafc;
          font-style: italic;
        }

        .newsletter-text-content code {
          background-color: #f1f5f9;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .newsletter-text-content pre {
          background-color: #1e293b;
          color: #f1f5f9;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 16px 0;
        }

        .newsletter-text-content pre code {
          background: none;
          color: inherit;
          padding: 0;
        }

        .newsletter-text-content a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .newsletter-text-content a:hover {
          color: #1d4ed8;
        }

        .newsletter-text-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }

        .newsletter-text-content th,
        .newsletter-text-content td {
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          text-align: left;
        }

        .newsletter-text-content th {
          background-color: #f8fafc;
          font-weight: bold;
        }

        .newsletter-text-content hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 24px 0;
        }

        .newsletter-text-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 12px 0;
        }

        .newsletter-text-content .ql-indent-1 { margin-left: 3em; }
        .newsletter-text-content .ql-indent-2 { margin-left: 6em; }
        .newsletter-text-content .ql-indent-3 { margin-left: 9em; }
        .newsletter-text-content .ql-indent-4 { margin-left: 12em; }
        .newsletter-text-content .ql-indent-5 { margin-left: 15em; }
        .newsletter-text-content .ql-indent-6 { margin-left: 18em; }
        .newsletter-text-content .ql-indent-7 { margin-left: 21em; }
        .newsletter-text-content .ql-indent-8 { margin-left: 24em; }

        .newsletter-text-content .ql-align-center { text-align: center; }
        .newsletter-text-content .ql-align-right { text-align: right; }
        .newsletter-text-content .ql-align-justify { text-align: justify; }

        .newsletter-text-content .ql-font-serif { font-family: Georgia, serif; }
        .newsletter-text-content .ql-font-monospace { font-family: 'Courier New', monospace; }

        .newsletter-text-content .ql-size-small { font-size: 0.75em; }
        .newsletter-text-content .ql-size-large { font-size: 1.5em; }
        .newsletter-text-content .ql-size-huge { font-size: 2.5em; }
      `}</style>
    </div>
  );
};