import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Mail, Edit, Eye, Copy, Trash2, Search, Menu } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useNotifications } from '../../hooks/useNotifications';
import type { Newsletter } from '../../types/newsletter-types';
import { EmailNewsletterButton } from './EmailNewsletterButton';

interface NewsletterPageProps {
  showHeader?: boolean;
}

export const NewsletterPage = ({ showHeader = true }: NewsletterPageProps) => {
  const navigate = useNavigate();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletters')
        .select('*, view_count')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsletters((data || []) as Newsletter[]);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      addNotification('error', 'Error fetching newsletters');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (newsletterId: string) => {
    if (!confirm('Biztos, hogy törölni szeretnéd ezt a hírlevelelet?')) return;

    try {
      // Delete related records first
      await supabase
        .from('newsletter_forms')
        .delete()
        .eq('newsletter_id', newsletterId);

      await supabase
        .from('newsletter_images')
        .delete()
        .eq('newsletter_id', newsletterId);

      // Then delete the newsletter
      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', newsletterId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      addNotification('success', 'Hírlevél sikeresen törölve');
      fetchNewsletters();
    } catch (error: any) {
      console.error('Error deleting newsletter:', error);
      addNotification('error', `Hiba a hírlevél törlése során: ${error?.message || 'Ismeretlen hiba'}`);
    }
  };

  const handleDuplicate = async (newsletterId: string) => {
    try {
      addNotification('info', 'Newsletter duplicating...');
      
      // Fetch original newsletter
      const { data: originalNewsletter, error: fetchError } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', newsletterId)
        .single();

      if (fetchError) throw fetchError;

      // Create new newsletter with copied data
      const { data: newNewsletter, error: insertError } = await supabase
        .from('newsletters')
        .insert({
          title: `Copy of ${originalNewsletter.title}`,
          description: originalNewsletter.description,
          campus: originalNewsletter.campus,
          content_guidelines: originalNewsletter.content_guidelines,
          generated_html: originalNewsletter.generated_html,
          components: originalNewsletter.components,
          status: 'draft',
          created_by: originalNewsletter.created_by
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Copy newsletter_forms relationships
      const { data: originalForms, error: formsError } = await supabase
        .from('newsletter_forms')
        .select('form_id')
        .eq('newsletter_id', newsletterId);

      if (formsError) throw formsError;

      if (originalForms && originalForms.length > 0) {
        const formsToInsert = originalForms.map(form => ({
          newsletter_id: newNewsletter.id,
          form_id: form.form_id
        }));

        const { error: formsInsertError } = await supabase
          .from('newsletter_forms')
          .insert(formsToInsert);

        if (formsInsertError) throw formsInsertError;
      }

      // Copy newsletter_images relationships
      const { data: originalImages, error: imagesError } = await supabase
        .from('newsletter_images')
        .select('image_url, image_name')
        .eq('newsletter_id', newsletterId);

      if (imagesError) throw imagesError;

      if (originalImages && originalImages.length > 0) {
        const imagesToInsert = originalImages.map(image => ({
          newsletter_id: newNewsletter.id,
          image_url: image.image_url,
          image_name: image.image_name
        }));

        const { error: imagesInsertError } = await supabase
          .from('newsletter_images')
          .insert(imagesToInsert);

        if (imagesInsertError) throw imagesInsertError;
      }

      addNotification('success', 'Newsletter duplicated successfully');
      fetchNewsletters();
      
      // Navigate to the duplicated newsletter in builder
      navigate(`/newsletter-builder/${newNewsletter.id}`);
    } catch (error) {
      console.error('Error duplicating newsletter:', error);
      addNotification('error', 'Error duplicating newsletter');
    }
  };

  const filteredNewsletters = newsletters
    .filter(newsletter => {
      const matchesSearch = 
        newsletter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (newsletter.description && newsletter.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCampus = campusFilter === 'all' || newsletter.campus === campusFilter;
      return matchesSearch && matchesCampus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={showHeader ? "min-h-screen bg-background" : ""}>
      <div className={showHeader ? "max-w-7xl mx-auto p-8 space-y-8" : "space-y-8"}>
        {showHeader && (
          <>
            {/* Clean Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-light tracking-tight text-foreground">Newsletters</h1>
                <p className="text-muted-foreground text-lg">
                  Create and manage AI-powered newsletters
                </p>
              </div>
              <Button 
                onClick={() => navigate('/newsletter-builder/new')}
                size="lg"
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Newsletter
              </Button>
            </div>
          </>
        )}

        {/* Clean Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-6 rounded-xl border shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search newsletters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-background border-0 shadow-sm focus:shadow-md transition-shadow"
            />
          </div>
          <div className="flex gap-3">
            <Select value={campusFilter} onValueChange={setCampusFilter}>
              <SelectTrigger className="w-48 h-12 bg-background border-0 shadow-sm">
                <SelectValue placeholder="All Campuses" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                <SelectItem value="all" className="hover:bg-gray-100">All Campuses</SelectItem>
                <SelectItem value="Feketerigó" className="hover:bg-gray-100">Feketerigó</SelectItem>
                <SelectItem value="Torockó" className="hover:bg-gray-100">Torockó</SelectItem>
                <SelectItem value="Levél" className="hover:bg-gray-100">Levél</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'date' | 'title') => setSortBy(value)}>
              <SelectTrigger className="w-48 h-12 bg-background border-0 shadow-sm">
                <SelectValue placeholder="Sort by Date" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                <SelectItem value="date" className="hover:bg-gray-100">Sort by Date</SelectItem>
                <SelectItem value="title" className="hover:bg-gray-100">Sort by Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Newsletter Grid */}
        {filteredNewsletters.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <EmptyState 
              icon={Mail}
              title="No Newsletters Found"
              description="Create your first AI-powered newsletter to get started"
              action={{
                label: 'Create Newsletter',
                onClick: () => navigate('/newsletter-builder/new')
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredNewsletters.map((newsletter) => (
              <Card key={newsletter.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-md bg-card">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {newsletter.title}
                      </CardTitle>
                      {newsletter.description && (
                        <CardDescription className="mt-2 line-clamp-2 text-sm leading-relaxed">
                          {newsletter.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                          <Menu className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border shadow-lg z-50">
                        <DropdownMenuItem onClick={() => window.open(`/newsletter/${newsletter.id}`, '_blank')} className="hover:bg-gray-100">
                          <Eye className="h-4 w-4 mr-3" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/newsletter-builder/${newsletter.id}`)} className="hover:bg-gray-100">
                          <Edit className="h-4 w-4 mr-3" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(newsletter.id)} className="hover:bg-gray-100">
                          <Copy className="h-4 w-4 mr-3" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="hover:bg-gray-100 p-0">
                          <EmailNewsletterButton
                            newsletterId={newsletter.id}
                            newsletterTitle={newsletter.title}
                            className="w-full justify-start px-2 py-1.5 text-sm border-0 bg-transparent hover:bg-gray-100"
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(newsletter.id)}
                          className="text-destructive focus:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-3" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(newsletter.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <Badge variant="secondary" className="font-medium">
                      {newsletter.campus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{newsletter.view_count || 0} views</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};