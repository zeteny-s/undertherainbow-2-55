import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
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

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <CardTitle className="text-lg">Edit Component</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={localComponent.label}
            onChange={(e) => setLocalComponent(prev => ({ ...prev, label: e.target.value }))}
            placeholder="Field label..."
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </div>
  );
};