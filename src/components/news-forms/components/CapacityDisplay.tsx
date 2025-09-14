import { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { Form } from '../../../types/form-types';

interface CapacityDisplayProps {
  form: Form;
}

interface ParticipantInfo {
  id: string;
  family_name: string | null;
  submitted_at: string;
}

export const CapacityDisplay = ({ form }: CapacityDisplayProps) => {
  const [submissionCount, setSubmissionCount] = useState(0);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissionData();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('form-submissions')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'form_submissions',
          filter: `form_id=eq.${form.id}`
        }, 
        () => {
          fetchSubmissionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [form.id]);

  const fetchSubmissionData = async () => {
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('id, family_name, submitted_at')
        .eq('form_id', form.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      setSubmissionCount(data.length);
      setParticipants(data.filter(sub => sub.family_name));
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlimited = form.unlimited_capacity;
  const capacity = form.capacity;
  const spotsRemaining = isUnlimited ? null : (capacity ? capacity - submissionCount : 0);
  const isFull = !isUnlimited && capacity && submissionCount >= capacity;

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <div className="font-medium text-gray-900">
              {isUnlimited ? (
                `${submissionCount} participants signed up`
              ) : (
                isFull ? (
                  <span className="text-red-600">Form is full ({submissionCount}/{capacity})</span>
                ) : (
                  `${spotsRemaining} spots remaining (${submissionCount}/${capacity})`
                )
              )}
            </div>
            {participants.length > 0 && (
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 mt-1"
              >
                View participants
                {showParticipants ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>
        {!isUnlimited && capacity && (
          <div className="flex items-center gap-2">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isFull ? 'bg-red-500' : submissionCount / capacity > 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((submissionCount / capacity) * 100, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">
              {Math.round((submissionCount / capacity) * 100)}%
            </span>
          </div>
        )}
      </div>
      
      {showParticipants && participants.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="max-h-32 overflow-y-auto">
            <div className="space-y-1">
              {participants.map((participant) => (
                <div key={participant.id} className="text-sm text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {participant.family_name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};