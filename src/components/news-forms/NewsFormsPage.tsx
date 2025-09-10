import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Copy, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, CampusType } from '@/types/form-types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const NewsFormsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState<CampusType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error(t('newsforms.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const filteredForms = forms
    .filter(form => {
      const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCampus = campusFilter === 'all' || form.campus === campusFilter;
      return matchesSearch && matchesCampus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  const handleDuplicate = async (form: Form) => {
    try {
      const { error } = await supabase
        .from('forms')
        .insert({
          title: `${form.title} - ${t('newsforms.copy')}`,
          description: form.description,
          campus: form.campus,
          status: 'inactive',
          form_components: form.form_components,
          created_by: user?.id
        });

      if (error) throw error;
      toast.success(t('newsforms.duplicateSuccess'));
      fetchForms();
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error(t('newsforms.errors.duplicateFailed'));
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm(t('newsforms.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;
      toast.success(t('newsforms.deleteSuccess'));
      fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error(t('newsforms.errors.deleteFailed'));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('newsforms.title')}</h1>
          <p className="text-muted-foreground">{t('newsforms.description')}</p>
        </div>
        <Button onClick={() => navigate('/forms/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('newsforms.createNew')}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('newsforms.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={campusFilter} onValueChange={(value) => setCampusFilter(value as CampusType | 'all')}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('newsforms.allCampuses')}</SelectItem>
            <SelectItem value="Feketerigó">Feketerigó</SelectItem>
            <SelectItem value="Torockó">Torockó</SelectItem>
            <SelectItem value="Levél">Levél</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'title')}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t('newsforms.sortByDate')}</SelectItem>
            <SelectItem value="title">{t('newsforms.sortByTitle')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredForms.length === 0 ? (
        <EmptyState 
          icon={<Plus className="h-16 w-16" />}
          title={t('newsforms.noForms')}
          description={t('newsforms.noFormsDescription')}
          action={
            <Button onClick={() => navigate('/forms/new')}>
              {t('newsforms.createFirst')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <Card key={form.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-2">{form.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('newsforms.preview')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('newsforms.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}/submissions`)}>
                        <Users className="h-4 w-4 mr-2" />
                        {t('newsforms.submissions')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(form)}>
                        <Copy className="h-4 w-4 mr-2" />
                        {t('newsforms.duplicate')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(form.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('newsforms.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {form.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{form.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={form.status === 'active' ? 'default' : 'secondary'}>
                    {t(`newsforms.status.${form.status}`)}
                  </Badge>
                  <Badge variant="outline">{form.campus}</Badge>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                {t('newsforms.createdAt', { date: new Date(form.created_at).toLocaleDateString() })}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};