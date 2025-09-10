import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { Upload } from 'lucide-react';
import { FormComponent } from '../../../types/form-types';

interface ComponentPreviewProps {
  component: FormComponent;
  value?: any;
  onChange?: (value: any) => void;
}

export const ComponentPreview = ({ component, value, onChange }: ComponentPreviewProps) => {
  const fieldStyle = component.properties?.bold ? 'font-bold' : '';
  const textSize = component.properties?.textSize || 'text-base';

  switch (component.type) {
    case 'text-input':
      return (
        <div className="space-y-2">
          <Label className={`${fieldStyle} ${textSize}`}>{component.label}</Label>
          <Input
            placeholder={component.placeholder || 'Enter text...'}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            required={component.required}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label className={`${fieldStyle} ${textSize}`}>{component.label}</Label>
          <Textarea
            placeholder={component.placeholder || 'Enter your message...'}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            required={component.required}
            rows={component.properties?.rows || 4}
          />
        </div>
      );

    case 'dropdown':
      return (
        <div className="space-y-2">
          <Label className={`${fieldStyle} ${textSize}`}>{component.label}</Label>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={component.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {(component.options || ['Option 1', 'Option 2', 'Option 3']).map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-3">
          <Label className={`${fieldStyle} ${textSize}`}>{component.label}</Label>
          <div className="space-y-2">
            {(component.options || ['Option 1', 'Option 2', 'Option 3']).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${component.id}-${index}`}
                  checked={Array.isArray(value) && value.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    if (checked) {
                      onChange?.([...currentValue, option]);
                    } else {
                      onChange?.(currentValue.filter(v => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${component.id}-${index}`} className="text-sm font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-3">
          <Label className={`${fieldStyle} ${textSize}`}>{component.label}</Label>
          <RadioGroup value={value} onValueChange={onChange}>
            {(component.options || ['Option 1', 'Option 2', 'Option 3']).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${component.id}-${index}`} />
                <Label htmlFor={`${component.id}-${index}`} className="text-sm font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'file-upload':
      return (
        <div className="space-y-2">
          <Label className={`${fieldStyle} ${textSize}`}>{component.label}</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              {component.placeholder || 'Click to upload or drag and drop'}
            </p>
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </div>
        </div>
      );

    case 'text-block':
      return (
        <div className="space-y-2">
          <div className={`${fieldStyle} ${textSize} text-gray-900`}>
            {component.label || 'Text block content goes here...'}
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="py-4">
          <div className="border-t border-gray-200"></div>
          {component.label && (
            <div className="text-center -mt-3">
              <span className="bg-white px-4 text-sm text-gray-500">{component.label}</span>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label className={`${fieldStyle} ${textSize}`}>{component.label}</Label>
          <div className="p-4 border rounded bg-gray-50">
            <p className="text-sm text-gray-600">Component type: {component.type}</p>
          </div>
        </div>
      );
  }
};