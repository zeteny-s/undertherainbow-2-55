import { useState, useEffect } from 'react';
import { Plus, Calendar, FileText, Edit, Eye, RefreshCw, Trash2, Search } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useNotifications } from '../../hooks/useNotifications';
import type { Newsletter } from '../../types/newsletter-types';

interface NewsletterPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const NewsletterPage = ({ onNavigate }: NewsletterPageProps) => {
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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsletters(data || []);
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
      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', newsletterId);

      if (error) throw error;
      
      addNotification('success', 'Hírlevél sikeresen törölve');
      fetchNewsletters();
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      addNotification('error', 'Hiba a hírlevél törlése során');
    }
  };

  const handleRegenerateContent = async (newsletterId: string) => {
    try {
      addNotification('info', 'Tartalom újragenerálása...');
      
      const { error } = await supabase.functions.invoke('newsletter-gemini', {
        body: { newsletterId, action: 'regenerate' }
      });

      if (error) throw error;
      
      addNotification('success', 'Tartalom sikeresen újragenerálva');
      fetchNewsletters();
    } catch (error) {
      console.error('Error regenerating content:', error);
      addNotification('error', 'Hiba a tartalom újragenerálása során');
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
    <div className="min-h-screen bg-background">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hírlevelek</h1>
            <p className="text-muted-foreground mt-2">
              AI által generált hírlevelek kezelése
            </p>
          </div>
          <Button 
            onClick={() => onNavigate('newsletter-builder')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Új Hírlevél
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Keresés hírlevelek között..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={campusFilter} onValueChange={setCampusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Telephely szűrés" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Minden telephely</SelectItem>
              <SelectItem value="Feketerigó">Feketerigó</SelectItem>
              <SelectItem value="Torockó">Torockó</SelectItem>
              <SelectItem value="Levél">Levél</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: 'date' | 'title') => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Rendezés" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Dátum szerint</SelectItem>
              <SelectItem value="title">Cím szerint</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Newsletter Grid */}
        {filteredNewsletters.length === 0 ? (
          <EmptyState 
            icon={FileText}
            title="Nincsenek hírlevelek"
            description="Kezdj el egy új hírlevél készítésével"
            action={{
              label: 'Új Hírlevél',
              onClick: () => onNavigate('newsletter-builder')
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNewsletters.map((newsletter) => (
              <Card key={newsletter.id} className="hover-lift">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{newsletter.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {newsletter.description}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(`/newsletter/${newsletter.id}`, '_blank')}>
                          <Eye className="h-4 w-4 mr-2" />
                          Előnézet
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onNavigate('newsletter-builder', newsletter.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Szerkesztés
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRegenerateContent(newsletter.id)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Újragenerálás
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(newsletter.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Törlés
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(newsletter.created_at).toLocaleDateString('hu-HU')}
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {newsletter.campus}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      newsletter.generated_html ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {newsletter.generated_html ? 'Generálva' : 'Vázlat'}
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