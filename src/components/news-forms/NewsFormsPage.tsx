import { useState, useEffect } from 'react';
import { Plus, Search, Menu, Eye, Edit, Copy, Trash2, Users } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Form, CampusType, FormComponent } from '../../types/form-types';
import { toast } from 'sonner';

interface NewsFormsPageProps {
  onNavigate: (tab: string) => void;
}

export const NewsFormsPage = ({ onNavigate }: NewsFormsPageProps) => {
  const { user } = useAuth();
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
      const formsData = (data || []).map(form => ({
        ...form,
        form_components: (form.form_components as unknown as FormComponent[]) || []
      }));
      setForms(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to fetch forms');
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
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('forms')
        .insert({
          title: `${form.title} - Copy`,
          description: form.description,
          campus: form.campus,
          status: 'inactive' as const,
          form_components: form.form_components as any,
          created_by: user.id
        });

      if (error) throw error;
      toast.success('Form duplicated successfully');
      fetchForms();
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error('Failed to duplicate form');
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;
      toast.success('Form deleted successfully');
      fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Failed to delete form');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">News & Forms</h1>
          <p className="text-muted-foreground">Create and manage forms for different campus locations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigate('news-forms-new')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Form
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={campusFilter} onValueChange={(value: string) => setCampusFilter(value as CampusType | 'all')}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-2 border-gray-200 shadow-lg z-[60]">
            <SelectItem value="all" className="bg-white hover:bg-gray-100 text-gray-900">All Campuses</SelectItem>
            <SelectItem value="Feketerigó" className="bg-white hover:bg-gray-100 text-gray-900">Feketerigó</SelectItem>
            <SelectItem value="Torockó" className="bg-white hover:bg-gray-100 text-gray-900">Torockó</SelectItem>
            <SelectItem value="Levél" className="bg-white hover:bg-gray-100 text-gray-900">Levél</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as 'date' | 'title')}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-2 border-gray-200 shadow-lg z-[60]">
            <SelectItem value="date" className="bg-white hover:bg-gray-100 text-gray-900">Sort by Date</SelectItem>
            <SelectItem value="title" className="bg-white hover:bg-gray-100 text-gray-900">Sort by Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredForms.length === 0 ? (
        <EmptyState 
          icon={Plus}
          title="No Forms Found"
          description="Create your first form to get started"
          action={{
            label: "Create First Form",
            onClick: () => onNavigate('news-forms-new')
          }}
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
                        <Menu className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-2 border-gray-200 shadow-lg z-[60]">
                      <DropdownMenuItem onClick={() => window.open(`/form/${form.id}`, '_blank')} className="bg-white hover:bg-gray-100 text-gray-900">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview (Test Form)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onNavigate(`news-forms-edit-${form.id}`)} className="bg-white hover:bg-gray-100 text-gray-900">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onNavigate(`news-forms-submissions-${form.id}`)} className="bg-white hover:bg-gray-100 text-gray-900">
                        <Users className="h-4 w-4 mr-2" />
                        Submissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(form)} className="bg-white hover:bg-gray-100 text-gray-900">
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(form.id)}
                        className="text-red-600 bg-white hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
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
                  <Badge variant="outline">{form.campus}</Badge>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Created {new Date(form.created_at).toLocaleDateString()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};