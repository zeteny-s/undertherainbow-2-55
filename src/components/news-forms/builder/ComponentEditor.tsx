import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { CardContent, CardHeader, CardTitle } from '../../ui/card';
import { FormComponent } from '../../../types/form-types';

interface ComponentEditorProps {
  component: FormComponent;
  onUpdate: (component: FormComponent) => void;
  onClose: () => void;
}

export const ComponentEditor = ({ component, onUpdate, onClose }: ComponentEditorProps) => {
  const [localComponent, setLocalComponent] = useState<FormComponent>(component);

  const handleSave = () => {
    onUpdate(localComponent);
    onClose();
  };

  const updateProperty = (key: string, value: any) => {
    setLocalComponent(prev => ({
      ...prev,
      properties: { ...prev.properties, [key]: value }
    }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(localComponent.options || [])];
    newOptions[index] = value;
    setLocalComponent(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    const newOptions = [...(localComponent.options || []), `Option ${(localComponent.options?.length || 0) + 1}`];
    setLocalComponent(prev => ({ ...prev, options: newOptions }));
  };

  const removeOption = (index: number) => {
    const newOptions = localComponent.options?.filter((_, i) => i !== index) || [];
    setLocalComponent(prev => ({ ...prev, options: newOptions }));
  };

  const hasOptions = ['dropdown', 'checkbox', 'radio'].includes(localComponent.type);
  const hasPlaceholder = ['text-input', 'textarea', 'dropdown', 'file-upload'].includes(localComponent.type);
  const hasTextStyling = !['divider', 'file-upload'].includes(localComponent.type);

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <CardTitle className="text-lg">Edit Component</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-6 p-6">
        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={localComponent.label}
            onChange={(e) => setLocalComponent(prev => ({ ...prev, label: e.target.value }))}
            placeholder="Field label..."
          />
        </div>

        {/* Placeholder */}
        {hasPlaceholder && (
          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder Text</Label>
            <Input
              id="placeholder"
              value={localComponent.placeholder || ''}
              onChange={(e) => setLocalComponent(prev => ({ ...prev, placeholder: e.target.value }))}
              placeholder="Enter placeholder text..."
            />
          </div>
        )}

        {/* Required Field */}
        {localComponent.type !== 'text-block' && localComponent.type !== 'divider' && (
          <div className="flex items-center justify-between">
            <Label htmlFor="required">Required Field</Label>
            <Switch
              id="required"
              checked={localComponent.required || false}
              onCheckedChange={(checked) => setLocalComponent(prev => ({ ...prev, required: checked }))}
            />
          </div>
        )}

        {/* Text Styling */}
        {hasTextStyling && (
          <>
            <div className="space-y-2">
              <Label htmlFor="textSize">Text Size</Label>
              <Select
                value={localComponent.properties?.textSize || 'text-base'}
                onValueChange={(value) => updateProperty('textSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-sm">Small</SelectItem>
                  <SelectItem value="text-base">Medium</SelectItem>
                  <SelectItem value="text-lg">Large</SelectItem>
                  <SelectItem value="text-xl">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="bold">Bold Text</Label>
              <Switch
                id="bold"
                checked={localComponent.properties?.bold || false}
                onCheckedChange={(checked) => updateProperty('bold', checked)}
              />
            </div>
          </>
        )}

        {/* Textarea Rows */}
        {localComponent.type === 'textarea' && (
          <div className="space-y-2">
            <Label htmlFor="rows">Rows</Label>
            <Input
              id="rows"
              type="number"
              min="2"
              max="10"
              value={localComponent.properties?.rows || 4}
              onChange={(e) => updateProperty('rows', parseInt(e.target.value))}
            />
          </div>
        )}

        {/* Options */}
        {hasOptions && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
            
            <div className="space-y-2">
              {(localComponent.options || []).map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  {(localComponent.options?.length || 0) > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text Block Content */}
        {localComponent.type === 'text-block' && (
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={localComponent.label}
              onChange={(e) => setLocalComponent(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Enter text content..."
              rows={4}
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </div>
  );
};