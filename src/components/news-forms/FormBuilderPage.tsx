import React, { useState, useEffect } from 'react';
import { Save, Eye, ArrowLeft, Settings } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ComponentLibrary } from './builder/ComponentLibrary';
import { DropZone } from './builder/DropZone';
import { ComponentEditor } from './builder/ComponentEditor';
import { LivePreview } from './builder/LivePreview';
import { Form, FormComponent, CampusType } from '@/types/form-types';
import { toast } from 'sonner';

export const FormBuilderPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [components, setComponents] = useState<FormComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<FormComponent | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<FormComponent | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const isNewForm = formId === 'new';

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
      setForm(data);
      setComponents(data.form_components || []);
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error(t('newsforms.errors.loadFailed'));
      navigate('/forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    if (!form || !form.title.trim()) {
      if (!isAutoSave) {
        toast.error(t('newsforms.errors.titleRequired'));
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
        form_components: components,
        created_by: user?.id,
      };

      if (isNewForm) {
        const { data, error } = await supabase
          .from('forms')
          .insert(formData)
          .select()
          .single();

        if (error) throw error;
        setForm(data);
        navigate(`/forms/${data.id}/edit`, { replace: true });
      } else {
        const { error } = await supabase
          .from('forms')
          .update(formData)
          .eq('id', formId);

        if (error) throw error;
      }

      if (!isAutoSave) {
        toast.success(t('newsforms.saveSuccess'));
      }
    } catch (error) {
      console.error('Error saving form:', error);
      if (!isAutoSave) {
        toast.error(t('newsforms.errors.saveFailed'));
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
              onClick={() => navigate('/forms')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('newsforms.backToForms')}
            </Button>
            <div>
              <h1 className="text-xl font-semibold">
                {isNewForm ? t('newsforms.newForm') : form.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('newsforms.formBuilder')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? t('newsforms.hidePreview') : t('newsforms.showPreview')}
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('newsforms.formSettings')}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t('newsforms.formSettings')}</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('newsforms.formTitle')} *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm(prev => prev ? {...prev, title: e.target.value} : null)}
                      placeholder={t('newsforms.formTitlePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('newsforms.formDescription')}</Label>
                    <Textarea
                      id="description"
                      value={form.description || ''}
                      onChange={(e) => setForm(prev => prev ? {...prev, description: e.target.value} : null)}
                      placeholder={t('newsforms.formDescriptionPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campus">{t('newsforms.campus')} *</Label>
                    <Select 
                      value={form.campus} 
                      onValueChange={(value) => setForm(prev => prev ? {...prev, campus: value as CampusType} : null)}
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
                    <Label htmlFor="status">{t('newsforms.active')}</Label>
                    <Switch
                      id="status"
                      checked={form.status === 'active'}
                      onCheckedChange={(checked) => 
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
              {saving ? t('newsforms.saving') : t('newsforms.save')}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Component Library */}
          <div className="w-80 border-r bg-card">
            <ComponentLibrary />
          </div>

          {/* Form Builder */}
          <div className="flex-1 flex">
            <div className={showPreview ? "w-1/2 border-r" : "w-full"}>
              <DropZone 
                components={components}
                onComponentSelect={setSelectedComponent}
                onComponentDelete={handleComponentDelete}
              />
            </div>

            {/* Live Preview */}
            {showPreview && (
              <div className="w-1/2">
                <LivePreview 
                  form={form}
                  components={components}
                />
              </div>
            )}
          </div>

          {/* Component Editor */}
          {selectedComponent && (
            <div className="w-80 border-l bg-card">
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