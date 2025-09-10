import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormComponent } from '@/types/form-types';

interface ComponentEditorProps {
  component: FormComponent;
  onUpdate: (component: FormComponent) => void;
  onClose: () => void;
}

export const ComponentEditor = ({ component, onUpdate, onClose }: ComponentEditorProps) => {
  const { t } = useTranslation();
  const [editedComponent, setEditedComponent] = useState<FormComponent>({ ...component });

  const handleSave = () => {
    onUpdate(editedComponent);
    onClose();
  };

  const addOption = () => {
    const newOptions = [...(editedComponent.options || []), `Új opció ${(editedComponent.options?.length || 0) + 1}`];
    setEditedComponent(prev => ({ ...prev, options: newOptions }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(editedComponent.options || [])];
    newOptions[index] = value;
    setEditedComponent(prev => ({ ...prev, options: newOptions }));
  };

  const removeOption = (index: number) => {
    const newOptions = (editedComponent.options || []).filter((_, i) => i !== index);
    setEditedComponent(prev => ({ ...prev, options: newOptions }));
  };

  const needsOptions = ['dropdown', 'checkbox', 'radio'].includes(component.type);
  const isTextBlock = component.type === 'text-block';

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <CardTitle className="text-lg">Komponens szerkesztése</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="label">Címke</Label>
          <Input
            id="label"
            value={editedComponent.label}
            onChange={(e) => setEditedComponent(prev => ({ ...prev, label: e.target.value }))}
            placeholder="Mező címkéje..."
          />
        </div>

        {!isTextBlock && (
          <>
            <div className="space-y-2">
              <Label htmlFor="placeholder">Helyőrző szöveg</Label>
              <Input
                id="placeholder"
                value={editedComponent.placeholder || ''}
                onChange={(e) => setEditedComponent(prev => ({ ...prev, placeholder: e.target.value }))}
                placeholder="Helyőrző szöveg..."
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="required">Kötelező mező</Label>
              <Switch
                id="required"
                checked={editedComponent.required || false}
                onCheckedChange={(checked) => setEditedComponent(prev => ({ ...prev, required: checked }))}
              />
            </div>
          </>
        )}

        {isTextBlock && (
          <div className="space-y-2">
            <Label htmlFor="content">Tartalom</Label>
            <Textarea
              id="content"
              value={editedComponent.properties?.content || ''}
              onChange={(e) => setEditedComponent(prev => ({ 
                ...prev, 
                properties: { ...prev.properties, content: e.target.value }
              }))}
              placeholder="Szöveges blokk tartalma..."
              rows={6}
            />
          </div>
        )}

        {needsOptions && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Opciók</Label>
              <Button size="sm" onClick={addOption} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Hozzáadás
              </Button>
            </div>
            
            <div className="space-y-2">
              {(editedComponent.options || []).map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`${index + 1}. opció`}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeOption(index)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {(!editedComponent.options || editedComponent.options.length === 0) && (
                <p className="text-sm text-muted-foreground">Még nincsenek opciók</p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-6 border-t">
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Mentés
          </Button>
          <Button variant="outline" onClick={onClose}>
            Mégse
          </Button>
        </div>
      </div>
    </div>
  );
};