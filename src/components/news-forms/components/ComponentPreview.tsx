import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { FormComponent } from '@/types/form-types';

interface ComponentPreviewProps {
  component: FormComponent;
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
}

export const ComponentPreview = ({ component, value, onChange, disabled = false }: ComponentPreviewProps) => {
  const renderComponent = () => {
    switch (component.type) {
      case 'text-input':
        return (
          <Input
            placeholder={component.placeholder || 'Szöveges bevitel...'}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={component.placeholder || 'Hosszabb szöveg...'}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            rows={4}
          />
        );

      case 'dropdown':
        return (
          <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Válasszon..." />
            </SelectTrigger>
            <SelectContent>
              {component.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {component.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${component.id}-${index}`}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onCheckedChange={(checked) => {
                    if (!Array.isArray(value)) {
                      onChange?.(checked ? [option] : []);
                    } else {
                      const newValue = checked 
                        ? [...value, option]
                        : value.filter((v: string) => v !== option);
                      onChange?.(newValue);
                    }
                  }}
                  disabled={disabled}
                />
                <Label htmlFor={`${component.id}-${index}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange} disabled={disabled}>
            {component.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${component.id}-${index}`} />
                <Label htmlFor={`${component.id}-${index}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'file-upload':
        return (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Kattintson vagy húzza ide a fájlt
            </p>
            <input
              type="file"
              className="hidden"
              accept={component.properties?.acceptedTypes || '*/*'}
              onChange={(e) => onChange?.(e.target.files?.[0])}
              disabled={disabled}
            />
          </div>
        );

      case 'text-block':
        return (
          <div className="prose prose-sm max-w-none">
            <p>{component.properties?.content || 'Szöveges blokk tartalma...'}</p>
          </div>
        );

      case 'divider':
        return <hr className="border-t border-border my-4" />;

      default:
        return <div className="text-muted-foreground">Ismeretlen komponens típus</div>;
    }
  };

  return (
    <div className="space-y-2">
      {component.label && (
        <Label className="text-sm font-medium">
          {component.label}
          {component.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {renderComponent()}
    </div>
  );
};