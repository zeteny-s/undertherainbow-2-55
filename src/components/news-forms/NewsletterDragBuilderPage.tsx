import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Bot, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { FormSelectionModal } from './newsletter-builder/FormSelectionModal';
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
import { Checkbox } from '../ui/checkbox';
import { NewsletterComponentLibrary } from './newsletter-builder/NewsletterComponentLibrary';
import { NewsletterComponentEditor } from './newsletter-builder/NewsletterComponentEditor';
import { NewsletterPreview } from './newsletter-builder/NewsletterPreview';
import { AIChat } from './newsletter-builder/AIChat';
import { NewsletterComponent, NewsletterBuilderState } from '../../types/newsletter-builder-types';
import { FormForSelection } from '../../types/newsletter-types';
import { CampusType } from '../../types/form-types';
import { toast } from 'sonner';

export const NewsletterDragBuilderPage = () => {
  const { newsletterId } = useParams<{ newsletterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  
  const [newsletterState, setNewsletterState] = useState<NewsletterBuilderState>({
    title: 'Untitled Newsletter',
    description: '',
    campus: 'Feketerigó',
    components: [],
    selectedFormIds: []
  });
  
  const [availableForms, setAvailableForms] = useState<FormForSelection[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<NewsletterComponent | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<NewsletterComponent | null>(null);

  const [showFormSelection, setShowFormSelection] = useState(false);

  const isNewNewsletter = newsletterId === 'new' || !newsletterId;

  useEffect(() => {
    fetchAvailableForms();
    if (isNewNewsletter) {
      setLoading(false);
      setShowFormSelection(true); // Show form selection modal for new newsletters
    } else {
      fetchNewsletter();
    }
  }, [newsletterId, isNewNewsletter]);

  const fetchAvailableForms = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('id, title, description, campus, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Error loading forms');
    }
  };

  const fetchNewsletter = async () => {
    if (!newsletterId || isNewNewsletter) return;

    try {
      setLoading(true);
      
      const { data: newsletterData, error: newsletterError } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', newsletterId)
        .single();

      if (newsletterError) throw newsletterError;

      // Parse existing content to components if needed
      let components: NewsletterComponent[] = [];
      if (newsletterData.generated_html) {
        // For now, show empty - in future, parse HTML to components
        components = [];
      }

      setNewsletterState({
        id: newsletterData.id,
        title: newsletterData.title,
        description: newsletterData.description || '',
        campus: newsletterData.campus,
        components,
        selectedFormIds: []
      });

      // Fetch selected forms
      const { data: formData, error: formError } = await supabase
        .from('newsletter_forms')
        .select('form_id')
        .eq('newsletter_id', newsletterId);

      if (formError) throw formError;
      
      setNewsletterState(prev => ({
        ...prev,
        selectedFormIds: formData.map(f => f.form_id)
      }));

    } catch (error) {
      console.error('Error fetching newsletter:', error);
      toast.error('Failed to load newsletter');
      navigate('/news-forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newsletterState.title.trim() || !user?.id) {
      toast.error('Newsletter title is required');
      return;
    }

    setSaving(true);
    try {
      // Convert components to HTML for storage
      const generatedHtml = generateHtmlFromComponents();
      
      const newsletterData = {
        title: newsletterState.title,
        description: newsletterState.description || null,
        campus: newsletterState.campus,
        content_guidelines: null,
        generated_html: generatedHtml,
        created_by: user.id,
      };

      let currentNewsletterId = newsletterId;

      if (isNewNewsletter) {
        const { data, error } = await supabase
          .from('newsletters')
          .insert(newsletterData)
          .select()
          .single();

        if (error) throw error;
        currentNewsletterId = data.id;
        setNewsletterState(prev => ({ ...prev, id: data.id }));
        
        // Update URL without navigation
        window.history.replaceState(null, '', `/newsletter-builder/${data.id}`);
      } else {
        const { error } = await supabase
          .from('newsletters')
          .update(newsletterData)
          .eq('id', newsletterId);

        if (error) throw error;
      }

      if (currentNewsletterId) {
        // Update selected forms
        await supabase
          .from('newsletter_forms')
          .delete()
          .eq('newsletter_id', currentNewsletterId);

        if (newsletterState.selectedFormIds.length > 0) {
          const formInserts = newsletterState.selectedFormIds.map(formId => ({
            newsletter_id: currentNewsletterId,
            form_id: formId
          }));

          const { error } = await supabase
            .from('newsletter_forms')
            .insert(formInserts);

          if (error) throw error;
        }
      }

      toast.success('Newsletter saved successfully!');
    } catch (error) {
      console.error('Error saving newsletter:', error);
      toast.error('Failed to save newsletter');
    } finally {
      setSaving(false);
    }
  };

  const generateHtmlFromComponents = (): string => {
    // Convert components to HTML - this is a simplified version
    const componentsHtml = newsletterState.components.map(component => {
      switch (component.type) {
        case 'heading':
          return `<h${component.content.level} style="color: ${component.content.color}; text-align: ${component.content.textAlign};">${component.content.text}</h${component.content.level}>`;
        case 'text-block':
          return `<div style="font-size: ${component.content.fontSize}; color: ${component.content.color}; text-align: ${component.content.textAlign};">${component.content.content}</div>`;
        case 'image':
          return `<img src="${component.content.url}" alt="${component.content.alt}" style="width: ${component.content.width};" />`;
        case 'button':
          return `<a href="${component.content.url}" style="display: inline-block; background-color: ${component.content.backgroundColor}; color: ${component.content.textColor}; padding: 12px 24px; text-decoration: none; border-radius: 4px;">${component.content.text}</a>`;
        case 'divider':
          return `<hr style="border: ${component.content.thickness} ${component.content.style} ${component.content.color};" />`;
        default:
          return '';
      }
    }).join('\n');

    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 20px; background: linear-gradient(to right, #f0f9ff, #f0fdf4);">
          <h1 style="color: #1f2937; margin-bottom: 10px;">${newsletterState.title}</h1>
          ${newsletterState.description ? `<p style="color: #6b7280;">${newsletterState.description}</p>` : ''}
        </div>
        <div style="padding: 20px;">
          ${componentsHtml}
        </div>
      </div>
    `;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const component = newsletterState.components.find(c => c.id === active.id);
    setDraggedComponent(component || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedComponent(null);

    if (!over) return;

    if (active.data.current?.type === 'library-item') {
      // Adding new component from library
      const newComponent: NewsletterComponent = {
        id: `component-${Date.now()}`,
        type: active.data.current.componentType,
        content: active.data.current.defaultConfig,
        position: newsletterState.components.length
      };
      
      setNewsletterState(prev => ({
        ...prev,
        components: [...prev.components, newComponent]
      }));
    } else if (active.id !== over.id) {
      // Reordering existing components
      setNewsletterState(prev => {
        const components = [...prev.components];
        const oldIndex = components.findIndex(item => item.id === active.id);
        const newIndex = components.findIndex(item => item.id === over.id);
        return {
          ...prev,
          components: arrayMove(components, oldIndex, newIndex)
        };
      });
    }
  };

  const handleComponentUpdate = (updatedComponent: NewsletterComponent) => {
    setNewsletterState(prev => ({
      ...prev,
      components: prev.components.map(c => 
        c.id === updatedComponent.id ? updatedComponent : c
      )
    }));
    setSelectedComponent(updatedComponent);
  };

  const handleComponentDelete = (componentId: string) => {
    setNewsletterState(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== componentId)
    }));
    setSelectedComponent(null);
  };

  const handleFormSelectionConfirm = (forms: FormForSelection[]) => {
    setNewsletterState(prev => ({
      ...prev,
      selectedFormIds: forms.map(f => f.id)
    }));
    setShowFormSelection(false);
  };

  const handleFormToggle = (formId: string, checked: boolean) => {
    setNewsletterState(prev => ({
      ...prev,
      selectedFormIds: checked 
        ? [...prev.selectedFormIds, formId]
        : prev.selectedFormIds.filter(id => id !== formId)
    }));
  };

  const selectedForms = availableForms.filter(form => 
    newsletterState.selectedFormIds.includes(form.id)
  );

  if (loading) {
    return <LoadingSpinner />;
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
              Back to Newsletters
            </Button>
            <div>
              <h1 className="text-xl font-semibold">
                {isNewNewsletter ? 'New Newsletter' : newsletterState.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Newsletter Builder
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIChat(true)}
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              Ask AI
            </Button>
            
            {newsletterState.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/newsletter/${newsletterState.id}`, '_blank')}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            )}
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  Newsletter Settings
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Newsletter Settings</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Newsletter Title *</Label>
                    <Input
                      id="title"
                      value={newsletterState.title}
                      onChange={(e) => setNewsletterState(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                      placeholder="Enter newsletter title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newsletterState.description}
                      onChange={(e) => setNewsletterState(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      placeholder="Enter newsletter description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campus">Campus *</Label>
                    <Select 
                      value={newsletterState.campus} 
                      onValueChange={(value: CampusType) => setNewsletterState(prev => ({
                        ...prev,
                        campus: value
                      }))}
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
                  
                  {/* Form Selection */}
                  <div className="space-y-2">
                    <Label>Select Forms to Include</Label>
                    <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-3">
                      {availableForms
                        .filter(form => form.campus === newsletterState.campus)
                        .map((form) => (
                          <div key={form.id} className="flex items-start space-x-3">
                            <Checkbox
                              id={`form-${form.id}`}
                              checked={newsletterState.selectedFormIds.includes(form.id)}
                              onCheckedChange={(checked) => handleFormToggle(form.id, checked as boolean)}
                            />
                            <div className="flex-1">
                              <Label 
                                htmlFor={`form-${form.id}`} 
                                className="text-sm font-medium cursor-pointer"
                              >
                                {form.title}
                              </Label>
                              {form.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {form.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <Button 
              onClick={handleSave} 
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
          <div className="w-80 border-r bg-white">
            <NewsletterComponentLibrary />
          </div>

          {/* Newsletter Preview */}
          <div className="flex-1 relative">
            <NewsletterPreview 
              components={newsletterState.components}
              selectedForms={selectedForms}
              onComponentSelect={setSelectedComponent}
              onComponentDelete={handleComponentDelete}
            />
          </div>

          {/* Component Editor */}
          {selectedComponent && (
            <div className="w-80 border-l bg-white">
              <NewsletterComponentEditor
                component={selectedComponent}
                onUpdate={handleComponentUpdate}
                onClose={() => setSelectedComponent(null)}
              />
            </div>
          )}

          {/* AI Chat */}
          {showAIChat && (
            <div className="w-96 border-l bg-white">
              <AIChat
                onClose={() => setShowAIChat(false)}
                context={{
                  title: newsletterState.title,
                  campus: newsletterState.campus,
                  selectedForms
                }}
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
              <p className="font-medium">{draggedComponent.type}</p>
            </CardContent>
          </Card>
        )}
      </DragOverlay>

      {/* Form Selection Modal */}
      <FormSelectionModal
        isOpen={showFormSelection}
        onClose={() => setShowFormSelection(false)}
        onConfirm={handleFormSelectionConfirm}
        campus={newsletterState.campus}
      />
    </DndContext>
  );
};