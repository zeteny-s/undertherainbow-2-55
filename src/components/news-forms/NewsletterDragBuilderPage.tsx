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
  const {
    newsletterId
  } = useParams<{
    newsletterId: string;
  }>();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
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

  // Track the current newsletter ID separately from URL params
  const [currentNewsletterId, setCurrentNewsletterId] = useState<string | null>(newsletterId && newsletterId !== 'new' ? newsletterId : null);
  const [availableForms, setAvailableForms] = useState<FormForSelection[]>([]);
export const NewsletterDragBuilderPage = () => {
  const { newsletterId } = useParams<{ newsletterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedComponent, setSelectedComponent] = useState<NewsletterComponent | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<NewsletterComponent | null>(null);
  const [showFormSelection, setShowFormSelection] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const isNewNewsletter = !currentNewsletterId;
  useEffect(() => {
    fetchAvailableForms();
    if (newsletterId && newsletterId !== 'new') {
      fetchNewsletter();
    } else {
      setLoading(false);
      setShowFormSelection(true); // Show form selection modal for new newsletters
    }
  }, [newsletterId]);

  const fetchAvailableForms = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('forms').select('id, title, description, campus, created_at').eq('status', 'active').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setAvailableForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Error loading forms');
    }
  };
  const fetchNewsletter = async () => {
    if (!newsletterId || newsletterId === 'new') return;
    try {
      setLoading(true);
      const {
        data: newsletterData,
        error: newsletterError
      } = await supabase.from('newsletters').select('*').eq('id', newsletterId).single();
      if (newsletterError) throw newsletterError;

      // Set the current newsletter ID
      setCurrentNewsletterId(newsletterData.id);

      // Load components from JSON if available, fallback to parsing HTML
      let components: NewsletterComponent[] = [];
      console.log('Newsletter data:', newsletterData);
      console.log('Available components:', newsletterData.components);
      console.log('Generated HTML length:', newsletterData.generated_html?.length);
      
      if (newsletterData.components && Array.isArray(newsletterData.components)) {
        components = newsletterData.components as any as NewsletterComponent[];
        console.log('Loaded components from JSON:', components);
      } else if (newsletterData.generated_html) {
        console.log('Parsing HTML to components...');
        components = parseHtmlToComponents(newsletterData.generated_html);
        console.log('Parsed components from HTML:', components);
      }
      
      console.log('Final components to render:', components);
      
      setNewsletterState({
        id: newsletterData.id,
        title: newsletterData.title,
        description: newsletterData.description || '',
        campus: newsletterData.campus,
        components,
        selectedFormIds: []
      });

      // Fetch selected forms
      const {
        data: formData,
        error: formError
      } = await supabase.from('newsletter_forms').select('form_id').eq('newsletter_id', newsletterId);
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
    if (!newsletterState.title.trim()) {
      toast.error('Newsletter title is required');
      return;
    }
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }
    setSaving(true);
    try {
      // Convert components to HTML for storage
      // Ensure components are properly sorted by position before saving
      const sortedComponents = [...newsletterState.components].sort((a, b) => a.position - b.position);
      
      const generatedHtml = generateHtmlFromComponents();
      console.log('Saving newsletter with HTML length:', generatedHtml.length, 'Components count:', sortedComponents.length);
      const status = 'published'; // Always save as published like forms

      const newsletterData = {
        title: newsletterState.title || 'Untitled Newsletter',
        description: newsletterState.description || null,
        campus: newsletterState.campus,
        content_guidelines: null,
        generated_html: generatedHtml,
        components: sortedComponents as any, // Store properly sorted components as JSON
        status: status,
        created_by: user.id
      };
      let savedNewsletterId = currentNewsletterId;
      if (isNewNewsletter) {
        const {
          data,
          error
        } = await supabase.from('newsletters').insert(newsletterData).select().single();
        if (error) throw error;
        savedNewsletterId = data.id;
        setCurrentNewsletterId(data.id); // Update the tracked ID
        setNewsletterState(prev => ({
          ...prev,
          id: data.id
        }));

        // Update URL for both auto-save and manual save
        window.history.replaceState(null, '', `/newsletter-builder/${data.id}`);
      } else if (savedNewsletterId) {
        const {
          error
        } = await supabase.from('newsletters').update(newsletterData).eq('id', savedNewsletterId);
        if (error) throw error;
      }
      if (savedNewsletterId) {
        // Update selected forms
        await supabase.from('newsletter_forms').delete().eq('newsletter_id', savedNewsletterId);
        if (newsletterState.selectedFormIds.length > 0) {
          const formInserts = newsletterState.selectedFormIds.map(formId => ({
            newsletter_id: savedNewsletterId,
            form_id: formId
          }));
          const {
            error
          } = await supabase.from('newsletter_forms').insert(formInserts);
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

  const parseHtmlToComponents = (html: string): NewsletterComponent[] => {
    const components: NewsletterComponent[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find the content area
    const contentDiv = doc.querySelector('div[style*="padding: 20px"]');
    if (!contentDiv) return components;
    
    // Parse child elements to components
    Array.from(contentDiv.children).forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      
      if (tagName.startsWith('h')) {
        const level = parseInt(tagName.charAt(1)) as 1 | 2 | 3 | 4 | 5 | 6;
        if (level >= 1 && level <= 6) {
          const style = element.getAttribute('style') || '';
          const colorMatch = style.match(/color:\s*([^;]+)/);
          const alignMatch = style.match(/text-align:\s*([^;]+)/);
          
          components.push({
            id: `component-${Date.now()}-${index}`,
            type: 'heading',
            content: {
              text: element.textContent || '',
              level,
              color: colorMatch ? colorMatch[1].trim() : '#000000',
              textAlign: alignMatch ? alignMatch[1].trim() as 'left' | 'center' | 'right' : 'left'
            },
            position: index
          });
        }
      } else if (tagName === 'div') {
        const style = element.getAttribute('style') || '';
        const colorMatch = style.match(/color:\s*([^;]+)/);
        const sizeMatch = style.match(/font-size:\s*([^;]+)/);
        const alignMatch = style.match(/text-align:\s*([^;]+)/);
        
        components.push({
          id: `component-${Date.now()}-${index}`,
          type: 'text-block',
          content: {
            content: element.innerHTML || '',
            fontSize: sizeMatch ? sizeMatch[1].trim() : '16px',
            color: colorMatch ? colorMatch[1].trim() : '#000000',
            textAlign: alignMatch ? alignMatch[1].trim() as 'left' | 'center' | 'right' : 'left'
          },
          position: index
        });
      } else if (tagName === 'img') {
        const src = element.getAttribute('src') || '';
        const alt = element.getAttribute('alt') || '';
        const style = element.getAttribute('style') || '';
        const widthMatch = style.match(/width:\s*([^;]+)/);
        
        components.push({
          id: `component-${Date.now()}-${index}`,
          type: 'image',
          content: {
            url: src,
            alt,
            width: widthMatch ? widthMatch[1].trim() : '100%'
          },
          position: index
        });
      } else if (tagName === 'a') {
        const href = element.getAttribute('href') || '';
        const style = element.getAttribute('style') || '';
        const bgColorMatch = style.match(/background-color:\s*([^;]+)/);
        const textColorMatch = style.match(/color:\s*([^;]+)/);
        
        components.push({
          id: `component-${Date.now()}-${index}`,
          type: 'button',
          content: {
            text: element.textContent || '',
            url: href,
            backgroundColor: bgColorMatch ? bgColorMatch[1].trim() : '#3b82f6',
            textColor: textColorMatch ? textColorMatch[1].trim() : '#ffffff'
          },
          position: index
        });
      } else if (tagName === 'hr') {
        const style = element.getAttribute('style') || '';
        const borderMatch = style.match(/border:\s*([^;]+)/);
        let thickness = '1px';
        let borderStyle = 'solid';
        let color = '#000000';
        
        if (borderMatch) {
          const parts = borderMatch[1].trim().split(' ');
          if (parts.length >= 3) {
            thickness = parts[0];
            borderStyle = parts[1];
            color = parts[2];
          }
        }
        
        components.push({
          id: `component-${Date.now()}-${index}`,
          type: 'divider',
          content: {
            thickness,
            style: borderStyle as 'solid' | 'dashed' | 'dotted',
            color
          },
          position: index
        });
      }
    });
    
    return components;
  };

  const generateHtmlFromComponents = (): string => {
    // Convert components to HTML with proper styling and list support
    if (newsletterState.components.length === 0) {
      return `
        <div style="
          margin-bottom: 15px; 
          text-align: left;
          font-size: 16px;
          font-weight: normal;
          color: #374151;
          line-height: 1.7;
        ">
          Add your content here...
        </div>
      `;
    }

    const componentsHtml = newsletterState.components
      .sort((a, b) => a.position - b.position)
      .map(component => {
        switch (component.type) {
          case 'heading':
            const heading = component.content;
            return `<h${heading.level} style="
              font-weight: bold; 
              margin: 20px 0 15px 0; 
              text-align: ${heading.textAlign || 'left'}; 
              color: ${heading.color || '#1f2937'};
              font-size: ${heading.level === 1 ? '2rem' : heading.level === 2 ? '1.5rem' : '1.25rem'};
            ">${heading.text}</h${heading.level}>`;
          
          case 'text-block':
            const textBlock = component.content;
            return `
              <div style="
                margin-bottom: 15px; 
                text-align: ${textBlock.textAlign || 'left'};
                line-height: 1.7;
              ">
                ${textBlock.content}
              </div>
              <style>
                ul { 
                  list-style-type: disc !important; 
                  margin: 16px 0 !important; 
                  padding-left: 20px !important; 
                }
                ol { 
                  list-style-type: decimal !important; 
                  margin: 16px 0 !important; 
                  padding-left: 20px !important; 
                }
                li { 
                  margin: 4px 0 !important; 
                  display: list-item !important;
                  list-style-position: outside !important;
                }
                p { margin: 8px 0 !important; }
                strong, b { font-weight: 600 !important; }
                em, i { font-style: italic !important; }
              </style>
            `;
          
          case 'image':
            const image = component.content;
            return `<div style="margin-bottom: 20px; text-align: center;">
              <img src="${image.url}" alt="${image.alt}" style="
                max-width: 100%; 
                height: auto; 
                border-radius: 8px;
                ${image.width ? `width: ${image.width};` : ''}
                ${image.height ? `height: ${image.height};` : ''}
              " />
            </div>`;
          
          case 'button':
            const button = component.content;
            const buttonSize = button.size === 'small' ? 'padding: 8px 16px; font-size: 14px;' : 
                             button.size === 'large' ? 'padding: 16px 32px; font-size: 18px;' : 
                             'padding: 12px 24px; font-size: 16px;';
            return `<div style="margin-bottom: 20px; text-align: center;">
              <a href="${button.url}" style="
                display: inline-block;
                ${buttonSize}
                border-radius: 8px;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.2s;
                background-color: ${button.backgroundColor || '#3b82f6'};
                color: ${button.textColor || '#ffffff'};
              ">${button.text}</a>
            </div>`;
          
          case 'divider':
            const divider = component.content;
            return `<hr style="
              margin: 30px 0; 
              border: none; 
              border-top: ${divider.thickness || '1px'} ${divider.style || 'solid'} ${divider.color || '#e5e7eb'};
            " />`;
          
          default:
            return '';
        }
      })
      .join('');

    // Return only the components without any header wrapper
    return componentsHtml;
  };
  const handleDragStart = (event: DragStartEvent) => {
    const {
      active
    } = event;
    const component = newsletterState.components.find(c => c.id === active.id);
    setDraggedComponent(component || null);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
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
      components: prev.components.map(c => c.id === updatedComponent.id ? updatedComponent : c)
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
      selectedFormIds: checked ? [...prev.selectedFormIds, formId] : prev.selectedFormIds.filter(id => id !== formId)
    }));
  };
  const selectedForms = availableForms.filter(form => newsletterState.selectedFormIds.includes(form.id));
  if (loading) {
    return <LoadingSpinner />;
  }
  return <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-white">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/news-forms')}>
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
            <Button variant="outline" size="sm" onClick={() => setShowAIChat(true)} className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Ask AI
            </Button>
            
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </Button>
            
            {newsletterState.id && <Button variant="outline" size="sm" onClick={() => window.open(`/newsletter/${newsletterState.id}`, '_blank')} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Open Newsletter
              </Button>}
            
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
                    <Input id="title" value={newsletterState.title} onChange={e => setNewsletterState(prev => ({
                    ...prev,
                    title: e.target.value
                  }))} placeholder="Enter newsletter title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={newsletterState.description} onChange={e => setNewsletterState(prev => ({
                    ...prev,
                    description: e.target.value
                  }))} placeholder="Enter newsletter description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campus">Campus *</Label>
                    <Select value={newsletterState.campus} onValueChange={(value: CampusType) => setNewsletterState(prev => ({
                    ...prev,
                    campus: value
                  }))}>
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
                      {availableForms.filter(form => form.campus === newsletterState.campus).map(form => <div key={form.id} className="flex items-start space-x-3">
                            <Checkbox id={`form-${form.id}`} checked={newsletterState.selectedFormIds.includes(form.id)} onCheckedChange={checked => handleFormToggle(form.id, checked as boolean)} />
                            <div className="flex-1">
                              <Label htmlFor={`form-${form.id}`} className="text-sm font-medium cursor-pointer">
                                {form.title}
                              </Label>
                              {form.description && <p className="text-xs text-muted-foreground mt-1">
                                  {form.description}
                                </p>}
                            </div>
                          </div>)}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex relative">
          {/* Component Library */}
          <div className={`w-80 border-r bg-white ${previewMode ? 'hidden' : 'block'}`}>
            <NewsletterComponentLibrary />
          </div>

          {/* Newsletter Preview */}
          <div className="flex-1 relative">
            <NewsletterPreview 
              components={newsletterState.components} 
              selectedForms={selectedForms} 
              onComponentSelect={previewMode ? undefined : setSelectedComponent} 
              onComponentDelete={previewMode ? undefined : handleComponentDelete}
              previewMode={previewMode}
            />
          </div>

          {/* Component Editor */}
          {selectedComponent && !previewMode && <div className="w-80 border-l bg-white">
              <NewsletterComponentEditor 
                component={selectedComponent} 
                selectedForms={selectedForms}
                onUpdate={handleComponentUpdate} 
                onClose={() => setSelectedComponent(null)} 
              />
            </div>}

          {/* AI Chat */}
          {showAIChat && <div className="w-96 border-l bg-white">
              <AIChat onClose={() => setShowAIChat(false)} context={{
            title: newsletterState.title,
            campus: newsletterState.campus,
            selectedForms
          }} />
            </div>}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedComponent && <Card className="w-64 opacity-90">
            <CardContent className="p-4">
              <p className="font-medium">{draggedComponent.type}</p>
            </CardContent>
          </Card>}
      </DragOverlay>

      {/* Form Selection Modal */}
      <FormSelectionModal isOpen={showFormSelection} onClose={() => setShowFormSelection(false)} onConfirm={handleFormSelectionConfirm} campus={newsletterState.campus} />
    </DndContext>
  );
};