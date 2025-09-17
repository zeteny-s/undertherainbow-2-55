import { useEffect, useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { supabase } from '../../../integrations/supabase/client';

interface OptionSubmissionsDropdownProps {
  formId: string;
  componentId: string;
  optionValue: string;
}

interface Submission {
  family_name: string;
  submitted_at: string;
}

export const OptionSubmissionsDropdown = ({ formId, componentId, optionValue }: OptionSubmissionsDropdownProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const fetchSubmissions = async () => {
    if (!formId || !componentId || !optionValue) return;
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('family_name, submitted_at, submission_data')
        .eq('form_id', formId);

      if (error) throw error;

      // Filter submissions that contain this option value
      const filteredSubmissions = data?.filter(submission => {
        const submissionData = submission.submission_data as any;
        const componentData = submissionData[componentId];
        
        if (Array.isArray(componentData)) {
          // For checkboxes
          return componentData.includes(optionValue);
        } else {
          // For radio buttons and dropdowns
          return componentData === optionValue;
        }
      }).map(submission => ({
        family_name: submission.family_name || 'Anonymous',
        submitted_at: submission.submitted_at
      })) || [];

      setSubmissions(filteredSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('option-submissions')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'form_submissions',
          filter: `form_id=eq.${formId}`
        }, 
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [formId, componentId, optionValue]);

  if (submissions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 p-1 ml-2">
          <Badge variant="secondary" className="text-xs">
            {submissions.length}
          </Badge>
          <Users className="h-3 w-3 ml-1" />
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-white border shadow-lg z-[70]">
        <div className="p-2">
          <div className="text-sm font-medium mb-2">
            Participants who selected "{optionValue}":
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {submissions.map((submission, index) => (
              <div key={index} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0">
                <div className="font-medium">{submission.family_name}</div>
                <div className="text-gray-400">
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};