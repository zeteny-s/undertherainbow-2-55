import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Calendar, User, Clock } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Form, FormSubmission } from '../../types/form-types';
import { toast } from 'sonner';

export const FormSubmissionsPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  useEffect(() => {
    if (formId) {
      fetchFormAndSubmissions();
    } else {
      navigate('/news-forms');
    }
  }, [formId, navigate]);

  const fetchFormAndSubmissions = async () => {
    if (!formId) return;
    
    try {
      // Fetch form details
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (formError) throw formError;
      
      // Transform the data to match our Form type
      const transformedForm: Form = {
        ...formData,
        form_components: (formData.form_components as any) || []
      };
      setForm(transformedForm);

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      
      // Transform submissions data
      const transformedSubmissions: FormSubmission[] = (submissionsData || []).map(submission => ({
        ...submission,
        submission_data: (submission.submission_data as any) || {},
        ip_address: submission.ip_address || undefined,
        family_name: submission.family_name || undefined
      }));
      setSubmissions(transformedSubmissions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!submissions.length) return;
    
    try {
      // Create CSV content
      const headers = ['Submission Date', 'Family Name', 'IP Address'];
      const formFields = form?.form_components?.map(comp => comp.label) || [];
      const csvHeaders = [...headers, ...formFields];
      
      const csvRows = submissions.map(submission => {
        const baseData = [
          new Date(submission.submitted_at).toLocaleString(),
          submission.family_name || 'N/A',
          submission.ip_address || 'N/A'
        ];
        
        const fieldData = formFields.map(field => {
          const value = submission.submission_data[field];
          return Array.isArray(value) ? value.join(', ') : (value || 'N/A');
        });
        
        return [...baseData, ...fieldData];
      });

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form?.title || 'form'}-submissions.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Submissions exported successfully');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export submissions');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Form not found</h2>
          <Button onClick={() => navigate('/news-forms')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/news-forms')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-4xl font-light tracking-tight text-foreground">
                Form Submissions
              </h1>
            </div>
            <div className="ml-11">
              <h2 className="text-xl text-muted-foreground">{form.title}</h2>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="secondary">{form.campus}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {submissions.length} submissions
                </span>
              </div>
            </div>
          </div>
          
          {submissions.length > 0 && (
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <EmptyState 
              icon={User}
              title="No Submissions Yet"
              description="This form hasn't received any submissions yet. Share the form link to start collecting responses."
              action={{
                label: "Preview Form",
                onClick: () => window.open(`/form/${form.id}`, '_blank')
              }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Submissions Grid */}
            <div className="grid gap-6">
              {submissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-muted-foreground" />
                          {submission.family_name || 'Anonymous'}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(submission.submitted_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSubmission(selectedSubmission?.id === submission.id ? null : submission)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {selectedSubmission?.id === submission.id ? 'Hide' : 'View'} Details
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {selectedSubmission?.id === submission.id && (
                    <CardContent className="border-t bg-muted/30">
                      <div className="space-y-4 pt-4">
                        {Object.entries(submission.submission_data).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">{key}:</div>
                            <div className="md:col-span-2 text-sm text-muted-foreground">
                              {Array.isArray(value) ? (
                                <div className="flex flex-wrap gap-1">
                                  {value.map((item, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {String(item)}
                                    </Badge>
                                  ))}
                                </div>
                              ) : typeof value === 'object' && value !== null ? (
                                <pre className="text-xs bg-background p-2 rounded border overflow-auto">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              ) : (
                                String(value || 'N/A')
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {submission.ip_address && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t">
                            <div className="font-medium text-sm">IP Address:</div>
                            <div className="md:col-span-2 text-sm text-muted-foreground font-mono">
                              {submission.ip_address}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};