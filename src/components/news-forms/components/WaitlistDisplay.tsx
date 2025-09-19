import { useEffect, useState } from 'react';
import { Clock, Users } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { Form } from '../../../types/form-types';

interface WaitlistDisplayProps {
  form: Form;
}

interface WaitlistEntry {
  id: string;
  family_name: string | null;
  submitted_at: string;
  waitlist_position: number | null;
}

export const WaitlistDisplay = ({ form }: WaitlistDisplayProps) => {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitlist();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('waitlist-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'form_submissions',
          filter: `form_id=eq.${form.id}`
        }, 
        () => {
          fetchWaitlist();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [form.id]);

  const fetchWaitlist = async () => {
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('id, family_name, submitted_at, waitlist_position')
        .eq('form_id', form.id)
        .eq('waitlisted', true)
        .order('submitted_at', { ascending: true });

      if (error) {
        console.error('Error fetching waitlist:', error);
        return;
      }

      setWaitlist(data || []);
    } catch (error) {
      console.error('Error in fetchWaitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 animate-pulse">
        <div className="h-4 bg-orange-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-orange-200 rounded w-24"></div>
      </div>
    );
  }

  if (waitlist.length === 0) {
    return null;
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-5 w-5 text-orange-600" />
        <h3 className="font-semibold text-orange-800">Waitlist</h3>
      </div>
      
      <div className="text-sm text-orange-700 mb-3">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{waitlist.length} family{waitlist.length !== 1 ? 'ies' : ''} on the waitlist</span>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto">
        <div className="space-y-2">
          {waitlist.map((entry, index) => (
            <div 
              key={entry.id}
              className="flex justify-between items-center py-2 px-3 bg-white rounded border border-orange-100"
            >
              <div className="flex items-center gap-3">
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                  #{index + 1}
                </span>
                <span className="font-medium text-gray-900">{entry.family_name || 'Anonymous'}</span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(entry.submitted_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-orange-600 mt-3 p-2 bg-orange-100 rounded">
        📝 If a spot becomes available, families will be contacted in order of submission time.
      </div>
    </div>
  );
};