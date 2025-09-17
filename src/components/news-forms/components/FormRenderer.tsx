import { FormComponent } from '../../../types/form-types';
import { ComponentPreview } from './ComponentPreview';

interface FormRendererProps {
  components: FormComponent[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  formId?: string;
}

export const FormRenderer = ({ components, values, onChange, formId }: FormRendererProps) => {
  return (
    <div className="space-y-6">
      {components.map((component) => (
        <div key={component.id}>
          <ComponentPreview
            component={component}
            value={values[component.id]}
            onChange={(value) => onChange(component.id, value)}
            formId={formId}
          />
        </div>
      ))}
    </div>
  );
};