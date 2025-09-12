import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { NewsletterComponent } from '../../../types/newsletter-builder-types';
import { SortableNewsletterComponent } from './SortableNewsletterComponent';
import { FormForSelection } from '../../../types/newsletter-types';
import kindergartenLogo from '../../../assets/kindergarten-logo.png';
import decoration1 from '../../../assets/decoration-1.png';
import decoration2 from '../../../assets/decoration-2.png';
import decoration3 from '../../../assets/decoration-3.png';

interface NewsletterPreviewProps {
  components: NewsletterComponent[];
  selectedForms: FormForSelection[];
  onComponentSelect: (component: NewsletterComponent) => void;
  onComponentDelete: (componentId: string) => void;
}

export const NewsletterPreview: React.FC<NewsletterPreviewProps> = ({
  components,
  selectedForms,
  onComponentSelect,
  onComponentDelete
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'newsletter-canvas'
  });

  const renderComponent = (component: NewsletterComponent) => {
    switch (component.type) {
      case 'heading':
        const HeadingTag = `h${component.content.level}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag 
            style={{ 
              textAlign: component.content.textAlign || 'left',
              color: component.content.color || '#1f2937',
              fontSize: component.content.level === 1 ? '2rem' : 
                       component.content.level === 2 ? '1.5rem' : '1.25rem',
              fontWeight: 'bold',
              margin: '1rem 0'
            }}
          >
            {component.content.text}
          </HeadingTag>
        );
      case 'text-block':
        return (
          <div 
            style={{
              fontSize: component.content.fontSize || '16px',
              fontWeight: component.content.fontWeight || 'normal',
              textAlign: component.content.textAlign || 'left',
              color: component.content.color || '#374151',
              lineHeight: '1.6',
              margin: '1rem 0'
            }}
            dangerouslySetInnerHTML={{ __html: component.content.content }}
          />
        );
      case 'image':
        return (
          <div style={{ margin: '1rem 0', textAlign: 'center' }}>
            {component.content.url ? (
              <img 
                src={component.content.url} 
                alt={component.content.alt || 'Newsletter image'}
                style={{
                  width: component.content.width || '100%',
                  height: component.content.height || 'auto',
                  maxWidth: '100%',
                  borderRadius: '8px'
                }}
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Click to add image</p>
              </div>
            )}
          </div>
        );
      case 'button':
        return (
          <div style={{ margin: '1.5rem 0', textAlign: 'center' }}>
            <a
              href={component.content.url || '#'}
              style={{
                display: 'inline-block',
                backgroundColor: component.content.backgroundColor || '#3b82f6',
                color: component.content.textColor || '#ffffff',
                padding: component.content.size === 'small' ? '8px 16px' :
                        component.content.size === 'large' ? '16px 32px' : '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: component.content.size === 'small' ? '14px' :
                          component.content.size === 'large' ? '18px' : '16px'
              }}
            >
              {component.content.text}
            </a>
          </div>
        );
      case 'divider':
        return (
          <hr 
            style={{
              border: 'none',
              borderTop: `${component.content.thickness || '1px'} ${component.content.style || 'solid'} ${component.content.color || '#e5e7eb'}`,
              margin: '2rem 0'
            }}
          />
        );
      default:
        return <div>Unknown component type</div>;
    }
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      {/* Newsletter Template */}
      <div 
        ref={setNodeRef}
        className={`max-w-2xl mx-auto bg-white shadow-lg ${isOver ? 'bg-blue-50' : ''}`}
        style={{ minHeight: '800px' }}
      >
        {/* Header with decorations and logo */}
        <div className="relative bg-gradient-to-r from-blue-50 to-green-50 p-8">
          <img 
            src={decoration1} 
            alt="" 
            className="absolute top-4 left-4 w-16 h-16 opacity-20"
          />
          <img 
            src={decoration2} 
            alt="" 
            className="absolute top-4 right-4 w-16 h-16 opacity-20"
          />
          <div className="text-center">
            <img 
              src={kindergartenLogo} 
              alt="Kindergarten Logo" 
              className="mx-auto h-20 mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Newsletter</h1>
          </div>
          <img 
            src={decoration3} 
            alt="" 
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-8 opacity-20"
          />
        </div>

        {/* Content Area - Droppable */}
        <div className="p-8">
          {components.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
              <p className="text-gray-500 text-lg">Drag components here to build your newsletter</p>
              <p className="text-gray-400 text-sm mt-2">Start with a heading or text block</p>
            </div>
          ) : (
            <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {components.map((component) => (
                  <SortableNewsletterComponent
                    key={component.id}
                    component={component}
                    onSelect={onComponentSelect}
                    onDelete={onComponentDelete}
                  >
                    {renderComponent(component)}
                  </SortableNewsletterComponent>
                ))}
              </div>
            </SortableContext>
          )}
        </div>

        {/* Selected Forms Section - Always at bottom */}
        {selectedForms.length > 0 && (
          <div className="border-t-2 border-gray-200 bg-gray-50 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
              Available Forms & Programs
            </h2>
            <div className="space-y-6">
              {selectedForms.map((form) => (
                <div 
                  key={form.id} 
                  className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-blue-600 mb-3">
                    {form.title}
                  </h3>
                  {form.description && (
                    <p className="text-gray-600 mb-4 line-height-relaxed">
                      {form.description}
                    </p>
                  )}
                  <button 
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    onClick={() => window.open(`/form/${form.id}`, '_blank')}
                  >
                    Fill out this form
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-100 p-6 text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} Kindergarten Newsletter</p>
        </div>
      </div>
    </div>
  );
};