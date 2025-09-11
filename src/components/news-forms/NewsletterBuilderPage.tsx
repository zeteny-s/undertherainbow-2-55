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
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => onNavigate('newsletters')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Vissza
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {newsletterId ? 'Hírlevél szerkesztése' : 'Új hírlevél'}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            {generatedHtml && (
              <Button 
                variant="outline" 
                onClick={() => window.open(`/newsletter/${newsletterId}`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Előnézet
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Mentés
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Alapadatok</CardTitle>
                <CardDescription>A hírlevél alapvető információi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Cím *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add meg a hírlevél címét"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Leírás</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Rövid leírás a hírlevélről"
                  />
                </div>
                <div>
                  <Label htmlFor="campus">Telephely</Label>
                  <Select value={campus} onValueChange={(value: CampusType) => setCampus(value)}>
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
              </CardContent>
            </Card>

            {/* Form Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Űrlapok kiválasztása</CardTitle>
                    <CardDescription>Válaszd ki a hírlélben megjelenítendő űrlapokat</CardDescription>
                  </div>
                  <Select value={campusFilter} onValueChange={setCampusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Minden</SelectItem>
                      <SelectItem value="Feketerigó">Feketerigó</SelectItem>
                      <SelectItem value="Torockó">Torockó</SelectItem>
                      <SelectItem value="Levél">Levél</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {filteredForms.map((form) => (
                    <div key={form.id} className="flex items-start space-x-2">
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
                      />
                      <div className="flex-1">
                        <Label htmlFor={form.id} className="text-sm font-medium cursor-pointer">
                          {form.title}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {form.description} • {form.campus}
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
            <Card>
              <CardHeader>
                <CardTitle>Tartalom irányelvek</CardTitle>
                <CardDescription>Add meg az AI-nak, milyen tartalmat generáljon</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={contentGuidelines}
                  onChange={(e) => setContentGuidelines(e.target.value)}
                  placeholder="Például: Készíts egy barátságos, családias hangvételű hírlevelelet ami bemutatja az új programokat..."
                  rows={6}
                />
                <div className="mt-4">
                  <Button 
                    onClick={handleGenerateContent}
                    disabled={generating || !title.trim() || selectedFormIds.length === 0}
                    className="w-full gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generálás...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Tartalom generálása
                      </>
                    )}
                  </Button>
                </div>
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