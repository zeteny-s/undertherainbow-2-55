import { useState, useEffect } from 'react';
import { FileText, Calendar, Edit } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Form, FormComponent } from '../../types/form-types';
import { toast } from 'sonner';

interface DraftsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (tab: string) => void;
}

export const DraftsModal = ({ open, onOpenChange, onNavigate }: DraftsModalProps) => {
  const [drafts, setDrafts] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDrafts();
    }
  }, [open]);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      const draftsData = (data || []).map(form => ({
        ...form,
        form_components: (form.form_components as unknown as FormComponent[]) || []
      }));
      setDrafts(draftsData);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast.error('Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWork = (draftId: string) => {
    onOpenChange(false);
    onNavigate(`news-forms-edit-${draftId}`);
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      toast.success('Draft deleted successfully');
      fetchDrafts();
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl bg-background overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Draft Forms
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <LoadingSpinner />
        ) : drafts.length === 0 ? (
          <EmptyState 
            icon={FileText}
            title="No Drafts Found"
            description="You don't have any draft forms yet. Create a new form to see drafts here."
            action={{
              label: "Create New Form",
              onClick: () => {
                onOpenChange(false);
                onNavigate('news-forms-new');
              }
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {drafts.map((draft) => (
              <Card key={draft.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base line-clamp-2">{draft.title}</CardTitle>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Draft
                    </Badge>
                  </div>
                  {draft.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{draft.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Last saved: {new Date(draft.updated_at).toLocaleString()}</span>
                    </div>
                    <Badge variant="outline" className="w-fit">{draft.campus}</Badge>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleContinueWork(draft.id)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Continue
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDeleteDraft(draft.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};