import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, X, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useNotifications } from '../../hooks/useNotifications';
import type { FormForSelection, NewsletterImage } from '../../types/newsletter-types';
import type { CampusType } from '../../types/form-types';

interface NewsletterBuilderPageProps {
  newsletterId?: string;
  onNavigate: (view: string) => void;
}

export const NewsletterBuilderPage = ({ newsletterId, onNavigate }: NewsletterBuilderPageProps) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Newsletter data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [campus, setCampus] = useState<CampusType>('Feketerigó');
  const [contentGuidelines, setContentGuidelines] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  
  // Forms and images
  const [availableForms, setAvailableForms] = useState<FormForSelection[]>([]);
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<NewsletterImage[]>([]);
  const [campusFilter, setCampusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAvailableForms();
    if (newsletterId) {
      fetchNewsletter();
    }
  }, [newsletterId]);

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
      addNotification('error', 'Error loading forms');
    }
  };

  const fetchNewsletter = async () => {
    if (!newsletterId) return;

    try {
      setLoading(true);
      
      // Fetch newsletter data
      const { data: newsletterData, error: newsletterError } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', newsletterId)
        .single();

      if (newsletterError) throw newsletterError;

      setTitle(newsletterData.title);
      setDescription(newsletterData.description || '');
      setCampus(newsletterData.campus);
      setContentGuidelines(newsletterData.content_guidelines || '');
      setGeneratedHtml(newsletterData.generated_html || '');

      // Fetch selected forms
      const { data: formData, error: formError } = await supabase
        .from('newsletter_forms')
        .select('form_id')
        .eq('newsletter_id', newsletterId);

      if (formError) throw formError;
      setSelectedFormIds(formData.map(f => f.form_id));

      // Fetch uploaded images
      const { data: imageData, error: imageError } = await supabase
        .from('newsletter_images')
        .select('*')
        .eq('newsletter_id', newsletterId);

      if (imageError) throw imageError;
      setUploadedImages(imageData || []);

    } catch (error) {
      console.error('Error fetching newsletter:', error);
      addNotification('error', 'Error loading newsletter');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      addNotification('error', 'A cím megadása kötelező');
      return;
    }

    if (!user?.id) return;

    try {
      setSaving(true);
      
      let currentNewsletterId = newsletterId;
      
      if (newsletterId) {
        // Update existing newsletter
        const { error } = await supabase
          .from('newsletters')
          .update({
            title,
            description: description || null,
            campus,
            content_guidelines: contentGuidelines || null,
            generated_html: generatedHtml || null
          })
          .eq('id', newsletterId);

        if (error) throw error;
      } else {
        // Create new newsletter
        const { data, error } = await supabase
          .from('newsletters')
          .insert({
            title,
            description: description || null,
            campus,
            content_guidelines: contentGuidelines || null,
            generated_html: generatedHtml || null,
            created_by: user.id
          })
          .select()
          .single();

        if (error) throw error;
        currentNewsletterId = data.id;
      }

      if (currentNewsletterId) {
        // Update selected forms
        await supabase
          .from('newsletter_forms')
          .delete()
          .eq('newsletter_id', currentNewsletterId);

        if (selectedFormIds.length > 0) {
          const formInserts = selectedFormIds.map(formId => ({
            newsletter_id: currentNewsletterId,
            form_id: formId
          }));

          const { error } = await supabase
            .from('newsletter_forms')
            .insert(formInserts);

          if (error) throw error;
        }
      }

      addNotification('success', 'Newsletter saved successfully');
    } catch (error) {
      console.error('Error saving newsletter:', error);
      addNotification('error', 'Error saving newsletter');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to append forms to the newsletter HTML
  const appendFormsToNewsletter = (html: string, forms: FormForSelection[]): string => {
    if (!forms || forms.length === 0) return html;

    const formsHtml = `
      <div style="margin-top: 48px; padding-top: 32px; border-top: 2px solid #e5e7eb;">
        <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 32px; text-align: center;">
          Available Forms & Programs
        </h2>
        ${forms.map((form, index) => `
          <div style="margin-bottom: ${index < forms.length - 1 ? '32px' : '0'}; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
            <h3 style="font-size: 20px; font-weight: 600; color: #3b82f6; margin-bottom: 12px;">
              ${form.title}
            </h3>
            ${form.description ? `
              <p style="color: #6b7280; margin-bottom: 16px; line-height: 1.6;">
                ${form.description}
              </p>
            ` : ''}
            <a href="/public-form/${form.id}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background-color 0.2s;">
              Fill out this form
            </a>
          </div>
          ${index < forms.length - 1 ? `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">` : ''}
        `).join('')}
      </div>
    `;

    return html + formsHtml;
  };

  const handleGenerateContent = async () => {
    if (!title.trim()) {
      addNotification('error', 'Please enter newsletter title first');
      return;
    }

    if (selectedFormIds.length === 0) {
      addNotification('error', 'Please select at least one form');
      return;
    }

    try {
      setGenerating(true);
      
      const selectedForms = availableForms.filter(form => 
        selectedFormIds.includes(form.id)
      );

      const imageUrls = uploadedImages.map(img => img.image_url);

      const { data, error } = await supabase.functions.invoke('newsletter-gemini', {
        body: {
          title,
          campus,
          contentGuidelines,
          selectedForms,
          imageUrls
        }
      });

      if (error) throw error;
      
      setGeneratedHtml(data.generatedHtml);
      addNotification('success', 'Content generated successfully');
      
    } catch (error) {
      console.error('Error generating content:', error);
      addNotification('error', 'Error generating content');
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!newsletterId) {
      addNotification('error', 'Először mentsd el a hírlevelelet');
      return;
    }

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${newsletterId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('newsletters')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('newsletters')
          .getPublicUrl(filePath);

        // Save to database
        const { data, error } = await supabase
          .from('newsletter_images')
          .insert({
            newsletter_id: newsletterId,
            image_url: publicUrl,
            image_name: file.name
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      const newImages = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...newImages]);
      addNotification('success', 'Images uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading images:', error);
      addNotification('error', 'Error uploading images');
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      
      setUploadedImages(prev => prev.filter(img => img.id !== imageId));
      addNotification('success', 'Image removed');
    } catch (error) {
      console.error('Error removing image:', error);
      addNotification('error', 'Error removing image');
    }
  };

  const filteredForms = availableForms.filter(form => 
    campusFilter === 'all' || form.campus === campusFilter
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Clean Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('newsletters')}
              className="hover:bg-muted px-3"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Newsletters
            </Button>
            <div className="space-y-1">
              <h1 className="text-4xl font-light tracking-tight text-foreground">
                {newsletterId ? 'Edit Newsletter' : 'Create Newsletter'}
              </h1>
              <p className="text-muted-foreground">
                {newsletterId ? 'Update your newsletter content and settings' : 'Build your AI-powered newsletter'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {generatedHtml && (
              <Button 
                variant="outline" 
                onClick={() => window.open(`/newsletter/${newsletterId}`, '_blank')}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <Eye className="h-5 w-5 mr-2" />
                Preview
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={saving}
              size="lg"
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
              Save Newsletter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Panel - Configuration */}
          <div className="xl:col-span-1 space-y-6">
            {/* Basic Info */}
            <Card className="border-0 shadow-md bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">Basic Information</CardTitle>
                <CardDescription className="text-base">Essential newsletter details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Newsletter Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter newsletter title..."
                    className="h-12 bg-background border-0 shadow-sm focus:shadow-md transition-shadow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the newsletter..."
                    className="h-12 bg-background border-0 shadow-sm focus:shadow-md transition-shadow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campus" className="text-sm font-medium">Campus</Label>
                  <Select value={campus} onValueChange={(value: CampusType) => setCampus(value)}>
                    <SelectTrigger className="h-12 bg-background border-0 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg z-50">
                      <SelectItem value="Feketerigó" className="hover:bg-gray-100">Feketerigó</SelectItem>
                      <SelectItem value="Torockó" className="hover:bg-gray-100">Torockó</SelectItem>
                      <SelectItem value="Levél" className="hover:bg-gray-100">Levél</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Form Selection */}
            <Card className="border-0 shadow-md bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold">Select Forms</CardTitle>
                    <CardDescription className="text-base">Choose forms to include in the newsletter</CardDescription>
                  </div>
                  <Select value={campusFilter} onValueChange={setCampusFilter}>
                    <SelectTrigger className="w-32 h-10 bg-background border-0 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg z-50">
                      <SelectItem value="all" className="hover:bg-gray-100">All</SelectItem>
                      <SelectItem value="Feketerigó" className="hover:bg-gray-100">Feketerigó</SelectItem>
                      <SelectItem value="Torockó" className="hover:bg-gray-100">Torockó</SelectItem>
                      <SelectItem value="Levél" className="hover:bg-gray-100">Levél</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {filteredForms.map((form) => (
                    <div key={form.id} className="flex items-start space-x-3 p-3 rounded-lg bg-background hover:bg-muted transition-colors">
                      <Checkbox
                        id={form.id}
                        checked={selectedFormIds.includes(form.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFormIds(prev => [...prev, form.id]);
                          } else {
                            setSelectedFormIds(prev => prev.filter(id => id !== form.id));
                          }
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={form.id} className="font-medium cursor-pointer block">
                          {form.title}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {form.description} • <span className="font-medium">{form.campus}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Upload images for the newsletter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={!newsletterId}
                    />
                    {!newsletterId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Save newsletter first to upload images
                      </p>
                    )}
                  </div>
                  
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {uploadedImages.map((image) => (
                        <div key={image.id} className="relative">
                          <img
                            src={image.image_url}
                            alt={image.image_name}
                            className="w-full h-20 object-cover rounded"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => handleRemoveImage(image.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content Guidelines */}
            <Card className="border-0 shadow-md bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">Content Guidelines</CardTitle>
                <CardDescription className="text-base">Provide instructions for AI content generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Textarea
                  value={contentGuidelines}
                  onChange={(e) => setContentGuidelines(e.target.value)}
                  placeholder="Example: Create a friendly, family-oriented newsletter that showcases new programs and upcoming events..."
                  rows={6}
                  className="bg-background border-0 shadow-sm focus:shadow-md transition-shadow resize-none"
                />
                <Button 
                  onClick={handleGenerateContent}
                  disabled={generating || !title.trim() || selectedFormIds.length === 0}
                  size="lg"
                  className="w-full shadow-sm hover:shadow-md transition-shadow"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div>
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Preview of the generated newsletter</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedHtml ? (
                  <div 
                    className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ 
                      __html: appendFormsToNewsletter(generatedHtml, selectedFormIds.map(id => 
                        availableForms.find(form => form.id === id)!
                      ).filter(Boolean))
                    }}
                  />
                ) : (
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center text-muted-foreground">
                    <p>Generated content will appear here</p>
                    <p className="text-sm mt-2">Fill in the data and click "Generate Content" button</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};