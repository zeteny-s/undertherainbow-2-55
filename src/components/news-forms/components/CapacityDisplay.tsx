import { useEffect, useState } from 'react';
import { Users, AlertCircle, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
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
  display_text?: string | null;
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
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [optionParticipants, setOptionParticipants] = useState<Record<string, ParticipantInfo[]>>({});

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
        .select('id, family_name, submitted_at, submission_data')
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

      // Calculate real counts for each option from submissions and collect participants
      const optionParticipantsMap: Record<string, ParticipantInfo[]> = {};
      
      const updatedCapacities = (capacities || []).map(capacity => {
        const component = form.form_components.find(c => c.id === capacity.component_id);
        if (!component) {
          console.warn(`Component not found for capacity: ${capacity.component_id}`);
          return capacity;
        }

        // Count how many submissions have this option selected and collect participants
        let actualCount = 0;
        const optionKey = `${capacity.component_id}-${capacity.option_value}`;
        optionParticipantsMap[optionKey] = [];
        
        submissions?.forEach((submission, index) => {
          if (!submission.submission_data) return;
          
          const submissionData = submission.submission_data as Record<string, any>;
          const componentValue = submissionData[capacity.component_id];
          
          // Debug logging for the first few submissions
          if (index < 3) {
            console.log(`Debug submission ${index}:`, {
              componentId: capacity.component_id,
              optionValue: capacity.option_value,
              submissionValue: componentValue,
              submissionData: submissionData
            });
          }
          
          let isSelected = false;
          if (Array.isArray(componentValue)) {
            // For checkboxes (multiple selections)
            if (componentValue.includes(capacity.option_value)) {
              isSelected = true;
              actualCount++;
            }
          } else if (componentValue === capacity.option_value) {
            // For radio buttons and dropdowns (single selection)
            isSelected = true;
            actualCount++;
          }
          
          // Add participant to this option's list if they selected it
          if (isSelected && submission.family_name) {
            optionParticipantsMap[optionKey].push({
              id: submission.id,
              family_name: submission.family_name,
              submitted_at: submission.submitted_at
            });
          }
        });

        console.log(`Final count for ${capacity.option_value}:`, actualCount);

        // Update the database with the real count
        supabase
          .from('form_option_capacity')
          .update({ current_count: actualCount })
          .eq('form_id', form.id)
          .eq('component_id', capacity.component_id)
          .eq('option_value', capacity.option_value)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating capacity count:', error);
            }
          });

        return {
          ...capacity,
          current_count: actualCount
        };
      });

      setOptionParticipants(optionParticipantsMap);

      setOptionCapacities(updatedCapacities);
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

  const toggleDropdown = (optionKey: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [optionKey]: !prev[optionKey]
    }));
  };

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
            <div className="space-y-3">
              {limitedOptions.map((capacity) => {
                const component = form.form_components.find(c => c.id === capacity.component_id);
                const isFull = capacity.current_count >= capacity.max_capacity;
                const spotsLeft = Math.max(0, capacity.max_capacity - capacity.current_count);
                const optionKey = `${capacity.component_id}-${capacity.option_value}`;
                const optionParticipantsList = optionParticipants[optionKey] || [];
                const isDropdownOpen = openDropdowns[optionKey];
                
                return (
                  <div key={optionKey} className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm text-gray-700">
                          <strong>{capacity.display_text || capacity.option_value}</strong>
                          {component?.label && (
                            <span className="text-gray-500 ml-1">({component.label})</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                        </span>
                        <Badge variant={isFull ? "destructive" : "secondary"} className="min-w-[80px] justify-center">
                          {capacity.current_count} / {capacity.max_capacity}
                        </Badge>
                        {capacity.current_count > 0 && (
                          <div className="relative">
                            <button 
                              onClick={() => toggleDropdown(optionKey)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              aria-label="Show participants"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-500" />
                            </button>
                            
                            {isDropdownOpen && (
                              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px] max-h-[200px] overflow-y-auto">
                                <div className="p-2 border-b border-gray-100">
                                  <h4 className="text-sm font-medium text-gray-900">Participants</h4>
                                </div>
                                <div className="p-2">
                                  {optionParticipantsList.length > 0 ? (
                                    <div className="space-y-1">
                                      {optionParticipantsList.map((participant) => (
                                        <div key={participant.id} className="text-sm text-gray-700 py-1 px-2 hover:bg-gray-50 rounded">
                                          {participant.family_name}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-500 py-2">No participants yet</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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

        {/* Warning if form is completely full */}
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