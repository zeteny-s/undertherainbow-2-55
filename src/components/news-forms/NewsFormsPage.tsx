import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Menu, Eye, Edit, Copy, Trash2, Users, FileText, Mail, Calendar } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Form, CampusType, FormComponent } from '../../types/form-types';
import { toast } from 'sonner';
import { NewsletterPage } from './NewsletterPage';
import { EmailFormButton } from './EmailFormButton';
import { GoogleCalendarsPage } from './GoogleCalendarsPage';

type ViewType = 'forms' | 'newsletters' | 'calendars';

export const NewsFormsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState<CampusType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [activeView, setActiveView] = useState<ViewType>('forms');

  const isNewslettersView = activeView === 'newsletters';
  const isFormsView = activeView === 'forms';
  const isCalendarsView = activeView === 'calendars';

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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Clean Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-light tracking-tight text-foreground">News & Forms</h1>
            <p className="text-muted-foreground text-lg">Manage your forms and newsletters with ease</p>
          </div>
          <Button 
            onClick={() => navigate(
              isFormsView ? '/news-forms/new' : 
              isNewslettersView ? '/newsletter-builder/new' : 
              '/calendars/new'
            )} 
            size="lg" 
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Plus className="h-5 w-5 mr-2" />
            {isFormsView ? 'Create New Form' : 
             isNewslettersView ? 'Create Newsletter' : 
             'Create Calendar'}
          </Button>
        </div>

        {/* Elegant Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-card rounded-xl border shadow-sm">
            <Button
              variant={isFormsView ? 'default' : 'ghost'}
              size="lg"
              onClick={() => setActiveView('forms')}
              className={`flex items-center gap-3 px-8 py-3 transition-all duration-200 ${
                isFormsView 
                  ? 'shadow-sm bg-primary text-primary-foreground hover:bg-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium">Forms</span>
            </Button>
            <Button
              variant={isNewslettersView ? 'default' : 'ghost'}
              size="lg"
              onClick={() => setActiveView('newsletters' as ViewType)}
              className={`flex items-center gap-3 px-8 py-3 transition-all duration-200 ${
                isNewslettersView 
                  ? 'shadow-sm bg-primary text-primary-foreground hover:bg-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Mail className="h-5 w-5" />
              <span className="font-medium">Newsletters</span>
            </Button>
            <Button
              variant={isCalendarsView ? 'default' : 'ghost'}
              size="lg"
              onClick={() => setActiveView('calendars' as ViewType)}
              className={`flex items-center gap-3 px-8 py-3 transition-all duration-200 ${
                isCalendarsView 
                  ? 'shadow-sm bg-primary text-primary-foreground hover:bg-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Google Calendars</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {isNewslettersView ? (
          <NewsletterPage showHeader={false} />
        ) : isCalendarsView ? (
          <GoogleCalendarsPage />
        ) : (
          <>
            {/* Clean Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-6 rounded-xl border shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-background border-0 shadow-sm focus:shadow-md transition-shadow"
                />
              </div>
              <div className="flex gap-3">
                <Select value={campusFilter} onValueChange={(value: string) => setCampusFilter(value as CampusType | 'all')}>
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
                <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as 'date' | 'title')}>
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

            {/* Content Grid */}
            {filteredForms.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <EmptyState 
                  icon={FileText}
                  title="No Forms Found"
                  description="Create your first form to get started with our intuitive form builder"
                  action={{
                    label: "Create First Form",
                    onClick: () => navigate('/news-forms/new')
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredForms.map((form) => (
                  <Card key={form.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-md bg-card">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                            {form.title}
                          </CardTitle>
                          {form.description && (
                            <p className="text-muted-foreground line-clamp-2 mt-2 text-sm leading-relaxed">
                              {form.description}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                              <Menu className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border shadow-lg z-50">
                            <DropdownMenuItem onClick={() => window.open(`/form/${form.id}`, '_blank')} className="hover:bg-gray-100">
                              <Eye className="h-4 w-4 mr-3" />
                              Preview Form
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/news-forms/edit/${form.id}`)} className="hover:bg-gray-100">
                              <Edit className="h-4 w-4 mr-3" />
                              Edit Form
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/news-forms/submissions/${form.id}`)} className="hover:bg-gray-100">
                              <Users className="h-4 w-4 mr-3" />
                              View Submissions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(form)} className="hover:bg-gray-100">
                              <Copy className="h-4 w-4 mr-3" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="hover:bg-gray-100 p-0">
                              <EmailFormButton
                                formId={form.id}
                                formTitle={form.title}
                                className="w-full justify-start px-2 py-1.5 text-sm border-0 bg-transparent hover:bg-gray-100"
                              />
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(form.id)}
                              className="text-destructive focus:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-3" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="font-medium">
                          {form.campus}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(form.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};