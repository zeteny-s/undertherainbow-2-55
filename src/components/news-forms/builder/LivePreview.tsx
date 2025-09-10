import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Form, FormComponent } from '../../../types/form-types';
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
  form: Form;
  components: FormComponent[];
  onComponentSelect?: (component: FormComponent) => void;
  onComponentDelete?: (componentId: string) => void;
}

export const LivePreview = ({ form, components, onComponentSelect, onComponentDelete }: LivePreviewProps) => {
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
    <div className="h-full overflow-y-auto bg-white relative" style={{
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
            className="fixed opacity-20 pointer-events-none z-10"
            style={{
              position: 'fixed',
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
        className={`relative z-20 max-w-2xl mx-auto px-5 py-10 min-h-screen flex flex-col justify-center items-center ${
          isOver ? 'bg-blue-50/30' : ''
        }`}
      >
        <div className="bg-white rounded-3xl shadow-2xl p-16 relative w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={logo} 
              alt="Under the Rainbow Kindergarten and Nursery" 
              className="max-w-full h-auto mx-auto mb-6"
              style={{ maxWidth: '300px' }}
            />
          </div>

          {/* Form Title */}
          {form.title && (
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {form.title}
              </h1>
              {form.description && (
                <p className="text-gray-600 text-sm">{form.description}</p>
              )}
            </div>
          )}

          {/* Form Content */}
          <div className="space-y-6">
            {components.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                <p className="text-lg font-medium mb-2">Drop form components here</p>
                <p className="text-sm">Drag components from the left sidebar to build your form</p>
              </div>
            ) : onComponentSelect ? (
              // Builder mode with sortable components
              <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {components.map((component) => (
                    <SortableFormComponent
                      key={component.id}
                      component={component}
                      onSelect={() => onComponentSelect(component)}
                      onDelete={() => onComponentDelete?.(component.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            ) : (
              // Preview mode with rendered form
              <form className="space-y-6">
                <FormRenderer
                  components={components}
                  values={previewData}
                  onChange={handleFieldChange}
                />
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};