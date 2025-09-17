import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { FormComponent } from '../types/form-types';

interface OptionCapacityInfo {
  [optionName: string]: {
    currentCount: number;
    capacity: number | null; // null means unlimited
    isAvailable: boolean;
    spotsRemaining: number | null; // null means unlimited
  };
}

export const useOptionCapacity = (formId: string, component: FormComponent) => {
  const [optionCapacities, setOptionCapacities] = useState<OptionCapacityInfo>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!component.options || !component.optionCapacities) {
      setLoading(false);
      return;
    }

    fetchOptionCounts();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('form-submissions-option-tracking')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'form_submissions',
          filter: `form_id=eq.${formId}`
        }, 
        () => {
          fetchOptionCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [formId, component.id, component.options, component.optionCapacities]);

  const fetchOptionCounts = async () => {
    try {
      // First, ensure capacity records exist for this component's options
      if (component.optionCapacities) {
        for (const [option, capacity] of Object.entries(component.optionCapacities)) {
          if (capacity !== null) {
            const { error: upsertError } = await supabase
              .from('form_option_capacity')
              .upsert({
                form_id: formId,
                component_id: component.id,
                option_value: option,
                max_capacity: capacity,
                current_count: 0
              }, {
                onConflict: 'form_id,component_id,option_value'
              });

            if (upsertError) {
              console.error('Error upserting capacity record:', upsertError);
            }
          }
        }
      }

      // Fetch current counts from form submissions
      const { data: submissions, error } = await supabase
        .from('form_submissions')
        .select('submission_data')
        .eq('form_id', formId);

      if (error) throw error;

      // Count selections for each option
      const optionCounts: Record<string, number> = {};
      
      // Initialize counts
      component.options?.forEach(option => {
        optionCounts[option] = 0;
      });

      // Count submissions
      submissions?.forEach(submission => {
        if (!submission.submission_data) return;
        
        const submissionData = submission.submission_data as Record<string, any>;
        const componentValue = submissionData[component.id];
        
        if (Array.isArray(componentValue)) {
          // For checkboxes (multiple selections)
          componentValue.forEach(value => {
            if (typeof value === 'string' && optionCounts.hasOwnProperty(value)) {
              optionCounts[value]++;
            }
          });
        } else if (typeof componentValue === 'string' && optionCounts.hasOwnProperty(componentValue)) {
          // For radio buttons and dropdowns (single selection)
          optionCounts[componentValue]++;
        }
      });

      // Update capacity records with current counts
      for (const [option, count] of Object.entries(optionCounts)) {
        if (component.optionCapacities?.[option] !== undefined) {
          await supabase
            .from('form_option_capacity')
            .update({ current_count: count })
            .eq('form_id', formId)
            .eq('component_id', component.id)
            .eq('option_value', option);
        }
      }

      // Build capacity info
      const capacityInfo: OptionCapacityInfo = {};
      
      component.options?.forEach(option => {
        const capacity = component.optionCapacities?.[option] || null;
        const currentCount = optionCounts[option] || 0;
        const isAvailable = capacity === null || currentCount < capacity;
        const spotsRemaining = capacity === null ? null : capacity - currentCount;

        capacityInfo[option] = {
          currentCount,
          capacity,
          isAvailable,
          spotsRemaining
        };
      });

      setOptionCapacities(capacityInfo);
    } catch (error) {
      console.error('Error fetching option capacities:', error);
    } finally {
      setLoading(false);
    }
  };

  return { optionCapacities, loading };
};