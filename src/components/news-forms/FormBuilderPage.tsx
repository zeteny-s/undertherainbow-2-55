import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Settings, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { ComponentLibrary } from './builder/ComponentLibrary';
import { ComponentEditor } from './builder/ComponentEditor';
import { LivePreview } from './builder/LivePreview';
import { Form, FormComponent, CampusType, FormStatus } from '../../types/form-types';
import { toast } from 'sonner';

export const FormBuilderPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
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
        title: 'Untitled Form',
        description: '',
        campus: 'Feketerigó',
        status: 'active' as FormStatus,
        form_components: [],
        created_by: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        capacity: null,
        unlimited_capacity: false,
      });
      setLoading(false);
    } else {
      fetchForm();
    }
  }, [formId, isNewForm, user]);

  // Auto-save when form data changes
  useEffect(() => {
    if (!form || isNewForm || !form.id) return;
    
    const timeoutId = setTimeout(() => {
      if (form.title && form.title !== 'Untitled Form') {
        handleSave();
      }
    }, 2000); // Save 2 seconds after changes

    return () => clearTimeout(timeoutId);
  }, [form?.title, form?.description, form?.campus, components.length]);

  // Auto-save new forms when they get a title
  useEffect(() => {
    if (isNewForm && form && form.title && form.title !== 'Untitled Form') {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [form?.title, isNewForm]);

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
      navigate('/news-forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form || !form.title.trim() || !user?.id) {
      toast.error('Form title is required');
      return;
    }

    setSaving(true);
    try {
      const formData = {
        title: form.title,
        description: form.description,
        campus: form.campus,
        status: 'active' as FormStatus,
        form_components: components as any,
        capacity: form.capacity,
        unlimited_capacity: form.unlimited_capacity || false,
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
        navigate('/news-forms');
      } else {
        const { error } = await supabase
          .from('forms')
          .update(formData)
          .eq('id', formId);

        if (error) throw error;
      }

      toast.success('Form saved successfully! Click Preview to test it.');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form');
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
    } else if (active.id !== over.id) {
      // Reordering existing components
      setComponents((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
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
      <div className="h-screen flex flex-col bg-white">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/news-forms')}
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
            {!isNewForm && form.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/form/${form.id}`, '_blank')}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview & Test
              </Button>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Form Settings
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white border-l-2 border-gray-200 shadow-xl z-50">
                <SheetHeader className="bg-white border-b border-gray-200 pb-4">
                  <SheetTitle className="text-gray-900 font-semibold">Form Settings</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-6 bg-white">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-900 font-medium">Form Title *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => prev ? {...prev, title: e.target.value} : null)}
                      placeholder="Enter form title"
                      className="bg-white border-2 border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-900 font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => prev ? {...prev, description: e.target.value} : null)}
                      placeholder="Enter form description"
                      className="bg-white border-2 border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campus" className="text-gray-900 font-medium">Campus *</Label>
                    <Select 
                      value={form.campus} 
                      onValueChange={(value: string) => setForm(prev => prev ? {...prev, campus: value as CampusType} : null)}
                    >
                      <SelectTrigger className="bg-white border-2 border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-gray-300 shadow-lg z-[60]">
                        <SelectItem value="Feketerigó" className="bg-white hover:bg-gray-100 text-gray-900">Feketerigó</SelectItem>
                        <SelectItem value="Torockó" className="bg-white hover:bg-gray-100 text-gray-900">Torockó</SelectItem>
                        <SelectItem value="Levél" className="bg-white hover:bg-gray-100 text-gray-900">Levél</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-gray-900 font-medium">Capacity Settings</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="unlimited"
                          checked={form.unlimited_capacity || false}
                          onChange={() => setForm(prev => prev ? {...prev, unlimited_capacity: true, capacity: null} : null)}
                          className="w-4 h-4 text-primary"
                        />
                        <Label htmlFor="unlimited" className="text-gray-900">Unlimited capacity</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="limited"
                          checked={!form.unlimited_capacity}
                          onChange={() => setForm(prev => prev ? {...prev, unlimited_capacity: false} : null)}
                          className="w-4 h-4 text-primary"
                        />
                        <Label htmlFor="limited" className="text-gray-900">Limited capacity</Label>
                      </div>
                      {!form.unlimited_capacity && (
                        <div className="ml-7 space-y-2">
                          <Label htmlFor="capacity" className="text-gray-900 text-sm">Maximum number of participants</Label>
                          <Input
                            id="capacity"
                            type="number"
                            min="1"
                            value={form.capacity || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setForm(prev => prev ? {...prev, capacity: e.target.value ? parseInt(e.target.value) : null} : null)
                            }
                            placeholder="Enter maximum participants"
                            className="bg-white border-2 border-gray-300 text-gray-900"
                          />
                        </div>
                      )}
                    </div>
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
          <div className="w-80 border-r bg-white border-gray-200 z-10">
            <ComponentLibrary />
          </div>

          {/* Form Builder - Use kindergarten template as main view */}
          <div className="flex-1 relative z-20">
            <LivePreview 
              components={components}
              onComponentSelect={setSelectedComponent}
              onComponentDelete={handleComponentDelete}
            />
          </div>

          {/* Component Editor */}
          {selectedComponent && (
            <div className="w-80 border-l bg-white border-gray-200 z-30">
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