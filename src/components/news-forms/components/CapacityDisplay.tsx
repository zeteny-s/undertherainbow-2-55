import { useEffect, useState } from 'react';
import { Users, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { supabase } from '../../../integrations/supabase/client';
import { Form } from '../../../types/form-types';

interface CapacityDisplayProps {
  form: Form;
}

interface OptionCapacity {
  component_id: string;
  option_value: string;
  max_capacity: number;
  current_count: number;
}

interface ParticipantInfo {
  id: string;
  family_name: string | null;
  submitted_at: string;
}

export const CapacityDisplay = ({ form }: CapacityDisplayProps) => {
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [optionCapacities, setOptionCapacities] = useState<OptionCapacity[]>([]);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapacityData();
    
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
          fetchCapacityData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [form.id]);

  const fetchCapacityData = async () => {
    try {
      // Fetch submissions data
      const { data: submissions, error: submissionsError } = await supabase
        .from('form_submissions')
        .select('id, family_name, submitted_at')
        .eq('form_id', form.id)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      setTotalSubmissions(submissions?.length || 0);
      setParticipants(submissions?.filter(sub => sub.family_name) || []);

      // Fetch option capacities
      const { data: capacities, error: capacitiesError } = await supabase
        .from('form_option_capacity')
        .select('*')
        .eq('form_id', form.id);

      if (capacitiesError) throw capacitiesError;

      setOptionCapacities(capacities || []);
    } catch (error) {
      console.error('Error fetching capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  // Check if form has overall capacity limit
  const hasOverallLimit = form.capacity && !form.unlimited_capacity;
  const isFormFull = hasOverallLimit && totalSubmissions >= (form.capacity || 0);
  const spotsRemaining = hasOverallLimit ? Math.max(0, (form.capacity || 0) - totalSubmissions) : null;

  // Filter option capacities that have capacity limits
  const limitedOptions = optionCapacities.filter(cap => cap.max_capacity > 0);

  // Show display if there are submissions or capacity limits
  if (totalSubmissions === 0 && !hasOverallLimit && limitedOptions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4 mb-6">
      <div className="space-y-4">
        {/* Overall capacity display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium text-gray-900">
                {form.unlimited_capacity ? (
                  `${totalSubmissions} participants signed up`
                ) : hasOverallLimit ? (
                  isFormFull ? (
                    <span className="text-red-600">Form is full ({totalSubmissions}/{form.capacity})</span>
                  ) : (
                    `${spotsRemaining} spots remaining (${totalSubmissions}/${form.capacity})`
                  )
                ) : (
                  `${totalSubmissions} participants signed up`
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
          
          {hasOverallLimit && (
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isFormFull ? 'bg-red-500' : 
                    totalSubmissions / (form.capacity || 1) > 0.8 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((totalSubmissions / (form.capacity || 1)) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">
                {Math.round((totalSubmissions / (form.capacity || 1)) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Option-specific capacities */}
        {limitedOptions.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Option Availability</h4>
            <div className="space-y-2">
              {limitedOptions.map((capacity) => {
                const component = form.form_components.find(c => c.id === capacity.component_id);
                const isFull = capacity.current_count >= capacity.max_capacity;
                const spotsLeft = Math.max(0, capacity.max_capacity - capacity.current_count);
                
                return (
                  <div key={`${capacity.component_id}-${capacity.option_value}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        {component?.label}: <strong>{capacity.option_value}</strong>
                      </span>
                      {isFull && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <Badge variant={isFull ? "destructive" : "secondary"}>
                      {isFull ? 'Full' : `${spotsLeft} left`} ({capacity.current_count}/{capacity.max_capacity})
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Participants list */}
        {showParticipants && participants.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Participants</h4>
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

        {/* Warning if form is full */}
        {isFormFull && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            This form has reached its capacity limit and is no longer accepting submissions.
          </div>
        )}
      </div>
    </div>
  );
};