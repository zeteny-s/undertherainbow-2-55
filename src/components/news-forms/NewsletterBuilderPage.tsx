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
      addNotification('error', 'Hiba az űrlapok betöltése során');
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
      addNotification('error', 'Hiba a hírlevél betöltése során');
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

      addNotification('success', 'Hírlevél sikeresen mentve');
    } catch (error) {
      console.error('Error saving newsletter:', error);
      addNotification('error', 'Hiba a mentés során');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!title.trim()) {
      addNotification('error', 'Először add meg a hírlevél címét');
      return;
    }

    if (selectedFormIds.length === 0) {
      addNotification('error', 'Válassz ki legalább egy űrlapot');
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
      addNotification('success', 'Tartalom sikeresen generálva');
      
    } catch (error) {
      console.error('Error generating content:', error);
      addNotification('error', 'Hiba a tartalom generálása során');
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
      addNotification('success', 'Képek sikeresen feltöltve');
      
    } catch (error) {
      console.error('Error uploading images:', error);
      addNotification('error', 'Hiba a képek feltöltése során');
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
      addNotification('success', 'Kép eltávolítva');
    } catch (error) {
      console.error('Error removing image:', error);
      addNotification('error', 'Hiba a kép eltávolítása során');
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
              className="hover:bg-muted/70 px-3"
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
            <Card className="border-0 shadow-md bg-card/50 backdrop-blur-sm">
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
                    className="h-12 bg-background/80 border-0 shadow-sm focus:shadow-md transition-shadow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the newsletter..."
                    className="h-12 bg-background/80 border-0 shadow-sm focus:shadow-md transition-shadow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campus" className="text-sm font-medium">Campus</Label>
                  <Select value={campus} onValueChange={(value: CampusType) => setCampus(value)}>
                    <SelectTrigger className="h-12 bg-background/80 border-0 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-0 shadow-lg">
                      <SelectItem value="Feketerigó">Feketerigó</SelectItem>
                      <SelectItem value="Torockó">Torockó</SelectItem>
                      <SelectItem value="Levél">Levél</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Form Selection */}
            <Card className="border-0 shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold">Select Forms</CardTitle>
                    <CardDescription className="text-base">Choose forms to include in the newsletter</CardDescription>
                  </div>
                  <Select value={campusFilter} onValueChange={setCampusFilter}>
                    <SelectTrigger className="w-32 h-10 bg-background/80 border-0 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-0 shadow-lg">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Feketerigó">Feketerigó</SelectItem>
                      <SelectItem value="Torockó">Torockó</SelectItem>
                      <SelectItem value="Levél">Levél</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {filteredForms.map((form) => (
                    <div key={form.id} className="flex items-start space-x-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
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
                <CardTitle>Képek</CardTitle>
                <CardDescription>Tölts fel képeket a hírlevélhez</CardDescription>
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
                        Először mentsd el a hírlevelelet a képek feltöltéséhez
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
            <Card className="border-0 shadow-md bg-card/50 backdrop-blur-sm">
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
                  className="bg-background/80 border-0 shadow-sm focus:shadow-md transition-shadow resize-none"
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
                <CardTitle>Előnézet</CardTitle>
                <CardDescription>A generált hírlevél előnézete</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedHtml ? (
                  <div 
                    className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: generatedHtml }}
                  />
                ) : (
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center text-muted-foreground">
                    <p>A generált tartalom itt fog megjelenni</p>
                    <p className="text-sm mt-2">Töltsd ki az adatokat és klikkelj a "Tartalom generálása" gombra</p>
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