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

      <CardContent className="flex-1 overflow-y-auto space-y-6 p-6 bg-surface">
        {/* Label */}
        <div className="space-y-3">
          <Label htmlFor="label" className="text-sm font-semibold text-foreground">Label</Label>
          <Input
            id="label"
            value={localComponent.label}
            onChange={(e) => setLocalComponent(prev => ({ ...prev, label: e.target.value }))}
            placeholder="Field label..."
            className="border-2 border-border hover:border-border-hover focus:border-primary transition-colors"
          />
        </div>

        {/* Placeholder */}
        {hasPlaceholder && (
          <div className="space-y-3">
            <Label htmlFor="placeholder" className="text-sm font-semibold text-foreground">Placeholder Text</Label>
            <Input
              id="placeholder"
              value={localComponent.placeholder || ''}
              onChange={(e) => setLocalComponent(prev => ({ ...prev, placeholder: e.target.value }))}
              placeholder="Enter placeholder text..."
              className="border-2 border-border hover:border-border-hover focus:border-primary transition-colors"
            />
          </div>
        )}

        {/* Required Field */}
        {localComponent.type !== 'text-block' && localComponent.type !== 'divider' && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
            <div className="space-y-1">
              <Label htmlFor="required" className="text-sm font-semibold text-foreground">Required Field</Label>
              <p className="text-xs text-muted-foreground">Make this field mandatory for form submission</p>
            </div>
            <Switch
              id="required"
              checked={localComponent.required || false}
              onCheckedChange={(checked) => setLocalComponent(prev => ({ ...prev, required: checked }))}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input border-2 border-border"
            />
          </div>
        )}

        {/* Text Styling */}
        {hasTextStyling && (
          <>
            <div className="space-y-3">
              <Label htmlFor="textSize" className="text-sm font-semibold text-foreground">Text Size</Label>
              <Select
                value={localComponent.properties?.textSize || 'text-base'}
                onValueChange={(value) => updateProperty('textSize', value)}
              >
                <SelectTrigger className="border-2 border-border hover:border-border-hover focus:border-primary transition-colors bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-2 border-border shadow-lg">
                  <SelectItem value="text-sm" className="hover:bg-accent focus:bg-accent">Small</SelectItem>
                  <SelectItem value="text-base" className="hover:bg-accent focus:bg-accent">Medium</SelectItem>
                  <SelectItem value="text-lg" className="hover:bg-accent focus:bg-accent">Large</SelectItem>
                  <SelectItem value="text-xl" className="hover:bg-accent focus:bg-accent">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
              <div className="space-y-1">
                <Label htmlFor="bold" className="text-sm font-semibold text-foreground">Bold Text</Label>
                <p className="text-xs text-muted-foreground">Make the text appear in bold font weight</p>
              </div>
              <Switch
                id="bold"
                checked={localComponent.properties?.bold || false}
                onCheckedChange={(checked) => updateProperty('bold', checked)}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input border-2 border-border"
              />
            </div>
          </>
        )}

        {/* Textarea Rows */}
        {localComponent.type === 'textarea' && (
          <div className="space-y-3">
            <Label htmlFor="rows" className="text-sm font-semibold text-foreground">Rows</Label>
            <Input
              id="rows"
              type="number"
              min="2"
              max="10"
              value={localComponent.properties?.rows || 4}
              onChange={(e) => updateProperty('rows', parseInt(e.target.value))}
              className="border-2 border-border hover:border-border-hover focus:border-primary transition-colors"
            />
          </div>
        )}

        {/* Options */}
        {hasOptions && (
          <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Options</Label>
                <p className="text-xs text-muted-foreground">Add and edit options for this field</p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addOption}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
            
            <div className="space-y-3">
              {(localComponent.options || []).map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="border-2 border-border hover:border-border-hover focus:border-primary transition-colors"
                  />
                  {(localComponent.options?.length || 0) > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="border-error text-error hover:bg-error hover:text-white shrink-0"
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
          <div className="space-y-3">
            <Label htmlFor="content" className="text-sm font-semibold text-foreground">Content</Label>
            <Textarea
              id="content"
              value={localComponent.label}
              onChange={(e) => setLocalComponent(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Enter text content..."
              rows={4}
              className="border-2 border-border hover:border-border-hover focus:border-primary transition-colors"
            />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground">
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose} className="border-2 border-border hover:border-border-hover">
            Cancel
          </Button>
        </div>
      </CardContent>
    </div>
  );
};