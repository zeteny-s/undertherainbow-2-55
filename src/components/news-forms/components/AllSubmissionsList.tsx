import { useEffect, useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { Form } from '../../../types/form-types';
import { Button } from '../../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';

interface AllSubmissionsListProps {
  form: Form;
}

interface Submission {
  id: string;
  family_name: string | null;
  submitted_at: string;
  waitlisted: boolean;
}

export const AllSubmissionsList = ({ form }: AllSubmissionsListProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('all-submissions-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'form_submissions',
          filter: `form_id=eq.${form.id}`
        }, 
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [form.id]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('id, family_name, submitted_at, waitlisted')
        .eq('form_id', form.id)
        .order('submitted_at', { ascending: true });

      if (error) {
        console.error('Error fetching submissions:', error);
        return;
      }

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error in fetchSubmissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || submissions.length === 0) {
    return null;
  }

  const acceptedSubmissions = submissions.filter(s => !s.waitlisted);
  const waitlistedSubmissions = submissions.filter(s => s.waitlisted);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">All Submissions</h3>
        </div>
        <span className="text-sm text-blue-700">
          {submissions.length} total submission{submissions.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-3">
        {/* Accepted Submissions */}
        {acceptedSubmissions.length > 0 && (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-between bg-white hover:bg-gray-50 border-blue-200"
                >
                  <span>✅ Accepted ({acceptedSubmissions.length})</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px] max-h-60 overflow-y-auto bg-white border shadow-lg z-50">
                {acceptedSubmissions.map((submission, index) => (
                  <DropdownMenuItem 
                    key={submission.id} 
                    className="flex justify-between items-center hover:bg-gray-100 cursor-default"
                  >
                    <span className="font-medium">
                      {submission.family_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500">
                      #{index + 1}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Waitlisted Submissions */}
        {waitlistedSubmissions.length > 0 && (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-between bg-white hover:bg-gray-50 border-orange-200"
                >
                  <span>⏳ Waitlist ({waitlistedSubmissions.length})</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px] max-h-60 overflow-y-auto bg-white border shadow-lg z-50">
                {waitlistedSubmissions.map((submission, index) => (
                  <DropdownMenuItem 
                    key={submission.id} 
                    className="flex justify-between items-center hover:bg-gray-100 cursor-default"
                  >
                    <span className="font-medium">
                      {submission.family_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500">
                      #{index + 1} in queue
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      <div className="text-xs text-blue-600 mt-3 p-2 bg-blue-100 rounded">
        👥 View all families who have submitted to this form
      </div>
    </div>
  );
};