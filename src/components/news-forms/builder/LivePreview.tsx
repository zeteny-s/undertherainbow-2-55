import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormComponent } from '../../../types/form-types';
import { FormRenderer } from '../components/FormRenderer';
import { SortableFormComponent } from './SortableFormComponent';
import logo from '../../../assets/kindergarten-logo.png';
import decoration1 from '../../../assets/decoration-1.png';
import decoration2 from '../../../assets/decoration-2.png';
import decoration3 from '../../../assets/decoration-3.png';
import decoration4 from '../../../assets/decoration-4.png';
import decoration5 from '../../../assets/decoration-5.png';
import decoration6 from '../../../assets/decoration-6.png';

interface LivePreviewProps {
  components: FormComponent[];
  onComponentSelect?: (component: FormComponent) => void;
  onComponentDelete?: (componentId: string) => void;
  previewMode?: boolean;
}

export const LivePreview = ({ components, onComponentSelect, onComponentDelete, previewMode = false }: LivePreviewProps) => {
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const { isOver, setNodeRef } = useDroppable({ id: 'form-builder' });

  const handleFieldChange = (fieldId: string, value: any) => {
    setPreviewData(prev => ({
      ...prev,
      [fieldId]: value
    }));
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

          {/* Form Content */}
          <div className="space-y-6 relative z-50">
            {components.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl bg-background relative z-50">
                <p className="text-lg font-medium mb-2">Drop form components here</p>
                <p className="text-sm">Drag components from the left sidebar to build your form</p>
              </div>
            ) : previewMode || !onComponentSelect ? (
              // Clean preview mode - exactly what users will see
              <div className="space-y-6 relative z-50">
                {/* Family Name Field - matches PublicFormPage exactly */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label htmlFor="family-name" className="block text-sm font-semibold text-gray-900 mb-2">
                    Family Name *
                  </label>
                  <input
                    type="text"
                    id="family-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your family name"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    This will be displayed in the participant list
                  </p>
                </div>

                <form className="space-y-6">
                  <FormRenderer
                    components={components}
                    values={previewData}
                    onChange={handleFieldChange}
                  />
                  
                  <div className="pt-6">
                    <button 
                      type="button" 
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Form
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // Builder mode with sortable components
              <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4 relative z-50">
                  {components.map((component) => (
                    <div key={component.id} className="relative z-50 bg-white">
                      <SortableFormComponent
                        component={component}
                        onSelect={() => onComponentSelect(component)}
                        onDelete={() => onComponentDelete?.(component.id)}
                      />
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