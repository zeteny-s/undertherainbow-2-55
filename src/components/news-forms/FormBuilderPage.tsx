import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Settings } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Card, CardContent } from '../ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { ComponentLibrary } from './builder/ComponentLibrary';
import { ComponentEditor } from './builder/ComponentEditor';
import { LivePreview } from './builder/LivePreview';
import { Form, FormComponent, CampusType } from '../../types/form-types';
import { toast } from 'sonner';

interface FormBuilderPageProps {
  formId?: string;
  onNavigate: (tab: string) => void;
}

export const FormBuilderPage = ({ formId, onNavigate }: FormBuilderPageProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [components, setComponents] = useState<FormComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<FormComponent | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<FormComponent | null>(null);

  const isNewForm = formId === 'new' || !formId;

  useEffect(() => {
    if (isNewForm) {
      setForm({
        id: '',
        title: '',
        description: '',
        campus: 'Feketerigó',
        status: 'active',
        form_components: [],
        created_by: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setLoading(false);
    } else {
      fetchForm();
    }
  }, [formId, isNewForm, user]);

  useEffect(() => {
    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      if (form && form.title) {
        handleSave(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [form, components]);

  const fetchForm = async () => {
    if (!formId || isNewForm) return;

    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) throw error;
      const formData = {
        ...data,
        form_components: (data.form_components as unknown as FormComponent[]) || []
      };
      setForm(formData);
      setComponents(formData.form_components);
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to load form');
      onNavigate('news-forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    if (!form || !form.title.trim() || !user?.id) {
      if (!isAutoSave) {
        toast.error('Form title is required');
      }
      return;
    }

    setSaving(true);
    try {
      const formData = {
        title: form.title,
        description: form.description,
        campus: form.campus,
        status: form.status,
        form_components: components as any,
        created_by: user.id,
      };

      if (isNewForm) {
        const { data, error } = await supabase
          .from('forms')
          .insert(formData)
          .select()
          .single();

        if (error) throw error;
        const savedForm = {
          ...data,
          form_components: (data.form_components as unknown as FormComponent[]) || []
        };
        setForm(savedForm);
        onNavigate(`news-forms-edit-${data.id}`);
      } else {
        const { error } = await supabase
          .from('forms')
          .update(formData)
          .eq('id', formId);

        if (error) throw error;
      }

      if (!isAutoSave) {
        toast.success('Form saved successfully');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      if (!isAutoSave) {
        toast.error('Failed to save form');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const component = components.find(c => c.id === active.id);
    setDraggedComponent(component || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedComponent(null);

    if (!over) return;

    if (active.data.current?.type === 'library-item') {
      // Adding new component from library
      const newComponent: FormComponent = {
        id: `component-${Date.now()}`,
        type: active.data.current.componentType,
        label: active.data.current.name,
        required: false,
        ...active.data.current.defaultConfig
      };
      setComponents(prev => [...prev, newComponent]);
    }
  };

  const handleComponentUpdate = (updatedComponent: FormComponent) => {
    setComponents(prev => 
      prev.map(c => c.id === updatedComponent.id ? updatedComponent : c)
    );
    setSelectedComponent(updatedComponent);
  };

  const handleComponentDelete = (componentId: string) => {
    setComponents(prev => prev.filter(c => c.id !== componentId));
    setSelectedComponent(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!form) {
    return null;
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate('news-forms')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Button>
            <div>
              <h1 className="text-xl font-semibold">
                {isNewForm ? 'New Form' : form.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Form Builder
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Form Settings
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Form Settings</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Form Title *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => prev ? {...prev, title: e.target.value} : null)}
                      placeholder="Enter form title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => prev ? {...prev, description: e.target.value} : null)}
                      placeholder="Enter form description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campus">Campus *</Label>
                    <Select 
                      value={form.campus} 
                      onValueChange={(value: string) => setForm(prev => prev ? {...prev, campus: value as CampusType} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Feketerigó">Feketerigó</SelectItem>
                        <SelectItem value="Torockó">Torockó</SelectItem>
                        <SelectItem value="Levél">Levél</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="status">Active</Label>
                    <Switch
                      id="status"
                      checked={form.status === 'active'}
                      onCheckedChange={(checked: boolean) => 
                        setForm(prev => prev ? {...prev, status: checked ? 'active' : 'inactive'} : null)
                      }
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button 
              onClick={() => handleSave()} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex relative">
          {/* Component Library */}
          <div className="w-80 border-r bg-card z-10">
            <ComponentLibrary />
          </div>

          {/* Form Builder - Use kindergarten template as main view */}
          <div className="flex-1 relative z-20">
            <LivePreview 
              form={form}
              components={components}
              onComponentSelect={setSelectedComponent}
              onComponentDelete={handleComponentDelete}
            />
          </div>

          {/* Component Editor */}
          {selectedComponent && (
            <div className="w-80 border-l bg-card z-30">
              <ComponentEditor
                component={selectedComponent}
                onUpdate={handleComponentUpdate}
                onClose={() => setSelectedComponent(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedComponent && (
          <Card className="w-64 opacity-90">
            <CardContent className="p-4">
              <p className="font-medium">{draggedComponent.label}</p>
              <p className="text-sm text-muted-foreground">{draggedComponent.type}</p>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
};