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

    // Subscribe to real-time updates on capacity changes
    const subscription = supabase
      .channel('form-option-capacity-tracking')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'form_option_capacity',
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

      // Fetch capacity data directly from form_option_capacity (publicly accessible)
      const { data: capacities, error } = await supabase
        .from('form_option_capacity')
        .select('*')
        .eq('form_id', formId)
        .eq('component_id', component.id);

      if (error) throw error;

      // Build capacity info using the stored capacity data
      const capacityInfo: OptionCapacityInfo = {};
      
      component.options?.forEach(option => {
        const capacity = component.optionCapacities?.[option] || null;
        const capacityRecord = capacities?.find(c => c.option_value === option);
        const currentCount = capacityRecord?.current_count || 0;
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