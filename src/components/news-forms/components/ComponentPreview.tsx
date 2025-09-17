import { useState } from 'react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { Upload, X, FileIcon } from 'lucide-react';
import { FormComponent } from '../../../types/form-types';
import { supabase } from '../../../integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarButton } from './CalendarButton';

interface ComponentPreviewProps {
  component: FormComponent;
  value?: any;
  onChange?: (value: any) => void;
}

export const ComponentPreview = ({ component, value, onChange }: ComponentPreviewProps) => {
  
  const fieldStyle = component.properties?.bold ? 'font-bold' : '';
  const textSize = component.properties?.textSize || 'text-base';
  const fontFamily = component.properties?.fontFamily || 'font-sans';
  const textAlign = component.properties?.textAlign || 'text-left';
  
  const labelClasses = `${fieldStyle} ${textSize} ${fontFamily} ${textAlign}`;

  switch (component.type) {
    case 'text-input':
      return (
        <div className="space-y-2">
          <Label className={labelClasses}>
            {component.label}
            {component.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
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
          <Label className={labelClasses}>
            {component.label}
            {component.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
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
          <Label className={labelClasses}>
            {component.label}
            {component.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={component.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent className="bg-white border-2 border-border shadow-lg z-[60]">
            {(component.options || ['Option 1', 'Option 2', 'Option 3']).map((option, index) => (
              <SelectItem 
                key={index} 
                value={option} 
                className="bg-white hover:bg-surface text-foreground"
              >
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
          <Label className={labelClasses}>
            {component.label}
            {component.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
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
                <Label 
                  htmlFor={`${component.id}-${index}`} 
                  className="text-sm font-normal flex-1"
                >
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
          <Label className={labelClasses}>
            {component.label}
            {component.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <RadioGroup value={value} onValueChange={onChange}>
            {(component.options || ['Option 1', 'Option 2', 'Option 3']).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option} 
                  id={`${component.id}-${index}`}
                />
                <Label 
                  htmlFor={`${component.id}-${index}`} 
                  className="text-sm font-normal flex-1"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'file-upload':
      return <FileUploadComponent component={component} value={value} onChange={onChange} />;

    case 'text-block':
      return (
        <div className="space-y-2">
          <div 
            className={`${labelClasses} text-foreground`}
            dangerouslySetInnerHTML={{ 
              __html: component.properties?.richContent || component.label || 'Text block content goes here...' 
            }}
          />
        </div>
      );

    case 'divider':
      return (
        <div className="py-4">
          <div className="border-t border-gray-200"></div>
        </div>
      );

    case 'calendar-button':
      return (
        <div className="space-y-2">
          <CalendarButton
            selectedCalendarId={component.properties?.selectedCalendarId || ''}
            buttonText={component.properties?.buttonText || 'Add to my calendar'}
            variant={component.properties?.variant || 'default'}
            className="w-full"
            isEditing={false}
          />
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label className={labelClasses}>{component.label}</Label>
          <div className="p-4 border rounded bg-surface">
            <p className="text-sm text-foreground-muted">Component type: {component.type}</p>
          </div>
        </div>
      );
  }
};

// File Upload Component
const FileUploadComponent = ({ component, value, onChange }: ComponentPreviewProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>(
    Array.isArray(value) ? value : (value ? [value] : [])
  );

  const fieldStyle = component.properties?.bold ? 'font-bold' : '';
  const textSize = component.properties?.textSize || 'text-base';
  const fontFamily = component.properties?.fontFamily || 'font-sans';
  const textAlign = component.properties?.textAlign || 'text-left';
  const labelClasses = `${fieldStyle} ${textSize} ${fontFamily} ${textAlign}`;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        // Use form-images bucket for form uploads
        const { data, error: uploadError } = await supabase.storage
          .from('form-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('form-images')
          .getPublicUrl(filePath);

        return {
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
          path: data.path
        };
      });

      const newFiles = await Promise.all(uploadPromises);
      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      onChange?.(updatedFiles);
      toast.success('Files uploaded successfully!');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  return (
    <div className="space-y-2">
      <Label className={labelClasses}>
        {component.label}
        {component.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          {component.placeholder || 'Click to upload or drag and drop'}
        </p>
        <div className="relative">
          <Button variant="outline" size="sm" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Choose Files'}
          </Button>
          <input
            type="file"
            multiple
            accept={component.properties?.acceptedTypes || 'image/*,application/pdf'}
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
        </div>
        {component.properties?.acceptedTypes && (
          <p className="text-xs text-gray-500 mt-1">
            Accepted types: {component.properties.acceptedTypes}
          </p>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploaded Files:</Label>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
              <FileIcon className="h-4 w-4 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                {file.size && (
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};