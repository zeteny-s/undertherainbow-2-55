import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { FormComponent } from '../../../types/form-types';

interface ComponentPreviewProps {
  component: FormComponent;
  value?: any;
  onChange?: (value: any) => void;
}

export const ComponentPreview = ({ component, value, onChange }: ComponentPreviewProps) => {
  if (component.type === 'text-input') {
    return (
      <div className="space-y-2">
        <Label>{component.label}</Label>
        <Input
          placeholder={component.placeholder}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{component.label}</Label>
      <div className="p-4 border rounded">
        <p className="text-sm text-muted-foreground">Component type: {component.type}</p>
      </div>
    </div>
  );
};