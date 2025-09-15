import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { NewsletterComponent } from '../../../types/newsletter-builder-types';
import { FormForSelection } from '../../../types/newsletter-types';
import { SortableNewsletterComponent } from './SortableNewsletterComponent';
import { ExternalLink } from 'lucide-react';
import logo from '../../../assets/kindergarten-logo.png';
import decoration1 from '../../../assets/decoration-1.png';
import decoration2 from '../../../assets/decoration-2.png';
import decoration3 from '../../../assets/decoration-3.png';
import decoration4 from '../../../assets/decoration-4.png';
import decoration5 from '../../../assets/decoration-5.png';
import decoration6 from '../../../assets/decoration-6.png';

interface NewsletterPreviewProps {
  components: NewsletterComponent[];
  selectedForms: FormForSelection[];
  onComponentSelect: (component: NewsletterComponent) => void;
  onComponentDelete: (componentId: string) => void;
}

export const NewsletterPreview = ({ components, selectedForms, onComponentSelect, onComponentDelete }: NewsletterPreviewProps) => {
  const { isOver, setNodeRef } = useDroppable({ id: 'newsletter-builder' });

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
        return (
          <div 
            className="mb-4"
            style={{ 
              // Only apply alignment, let the pasted HTML preserve its own formatting
              textAlign: textBlock.textAlign || 'left'
            }}
            dangerouslySetInnerHTML={{ __html: textBlock.content }}
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
              className={`inline-block px-6 py-3 rounded-lg font-medium transition-colors ${
                button.size === 'small' ? 'px-4 py-2 text-sm' : 
                button.size === 'large' ? 'px-8 py-4 text-lg' : 'px-6 py-3'
              }`}
              style={{
                backgroundColor: button.backgroundColor || '#3b82f6',
                color: button.textColor || 'white'
              }}
            >
              {button.text}
            </a>
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
            {/* Divider line */}
            <hr className="my-8 border-gray-300" />
            
            {/* Form section content */}
            <div 
              className={`mb-6 ${textAlignment}`}
              style={{
                color: formSection.textColor || '#1f2937',
                padding: formSection.padding || '20px'
              }}
            >
              <h3 className={`font-semibold text-xl mb-3 ${textAlignment}`}>
                {formSection.title || 'Additional Infos&Sign Up Forms'}
              </h3>
              {formSection.description && (
                <p className={`text-sm mb-4 opacity-80 ${textAlignment}`}>{formSection.description}</p>
              )}
              {formSection.customMessage && (
                <p className={`text-sm mb-6 italic ${textAlignment}`}>{formSection.customMessage}</p>
              )}
              
              {/* Render actual selected forms */}
              <div className="space-y-4">
                {selectedForms && selectedForms.length > 0 ? (
                  selectedForms.map((form) => (
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
                          <a
                            href={`/news-forms/public/${form.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center px-4 py-2 rounded font-medium text-sm transition-all duration-200 hover:shadow-md ${
                              formSection.buttonStyle === 'outline' 
                                ? 'border-2 bg-transparent hover:bg-opacity-10' 
                                : formSection.buttonStyle === 'secondary'
                                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                : 'hover:opacity-90'
                            }`}
                            style={{
                              backgroundColor: formSection.buttonStyle === 'outline' ? 'transparent' : 
                                              formSection.buttonStyle === 'secondary' ? '#e5e7eb' :
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
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                    <p className="text-sm text-gray-500 font-medium">No forms selected yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add forms using the form selection button in the sidebar</p>
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

      <div 
        ref={setNodeRef}
        className={`relative z-30 max-w-2xl mx-auto px-5 py-10 min-h-screen flex flex-col justify-center items-center ${
          isOver ? 'bg-muted' : ''
        }`}
      >
        <div className="bg-white rounded-3xl shadow-2xl p-16 relative w-full max-w-lg z-40 border border-gray-200">
          {/* Logo */}
          <div className="text-center mb-8 relative z-50">
            <img 
              src={logo} 
              alt="Under the Rainbow Kindergarten and Nursery" 
              className="max-w-full h-auto mx-auto mb-6"
              style={{ maxWidth: '300px' }}
            />
          </div>

          {/* Newsletter Content */}
          <div className="space-y-6 relative z-50">
            {components.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl bg-background relative z-50">
                <p className="text-lg font-medium mb-2">Drop newsletter components here</p>
                <p className="text-sm">Drag components from the left sidebar to build your newsletter</p>
              </div>
            ) : (
              <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4 relative z-50">
                  {components.map((component) => (
                    <div key={component.id} className="relative z-50 bg-white">
                      <SortableNewsletterComponent
                        component={component}
                        onSelect={() => onComponentSelect(component)}
                        onDelete={() => onComponentDelete(component.id)}
                      >
                        {renderComponent(component)}
                      </SortableNewsletterComponent>
                    </div>
                  ))}
                </div>
              </SortableContext>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};