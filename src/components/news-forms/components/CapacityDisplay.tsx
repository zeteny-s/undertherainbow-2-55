import { useEffect, useState } from 'react';
import { Users, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { supabase } from '../../../integrations/supabase/client';
import { Form } from '../../../types/form-types';
import { OptionSubmissionsDropdown } from './OptionSubmissionsDropdown';

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

export const CapacityDisplay = ({ form }: CapacityDisplayProps) => {
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [optionCapacities, setOptionCapacities] = useState<OptionCapacity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapacityData();
    
    // Subscribe to real-time updates on capacity changes
    const subscription = supabase
      .channel('form-capacity-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'form_option_capacity',
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
      // Fetch overall form submission count (non-waitlisted)
      const { count: totalCount, error: countError } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', form.id)
        .eq('waitlisted', false);

      if (countError) {
        console.error('Error fetching submissions count:', countError);
      } else {
        setTotalSubmissions(totalCount || 0);
      }

      // Fetch waitlist count
      const { count: waitlistCountData, error: waitlistError } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', form.id)
        .eq('waitlisted', true);

      if (waitlistError) {
        console.error('Error fetching waitlist count:', waitlistError);
      } else {
        setWaitlistCount(waitlistCountData || 0);
      }

      // Fetch option capacities (publicly accessible)
      const { data: capacities, error: capacitiesError } = await supabase
        .from('form_option_capacity')
        .select('*')
        .eq('form_id', form.id);

      if (capacitiesError) {
        console.error('Error fetching option capacities:', capacitiesError);
        return;
      }

      setOptionCapacities(capacities || []);

      // For public access, we don't show individual participants
      // Only show capacity information
    } catch (error) {
      console.error('Error in fetchCapacityData:', error);
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

  // Show display if there are submissions, capacity limits, or waitlist
  if (totalSubmissions === 0 && waitlistCount === 0 && !hasOverallLimit && limitedOptions.length === 0) {
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
                const isFull = capacity.current_count >= capacity.max_capacity;
                const spotsLeft = Math.max(0, capacity.max_capacity - capacity.current_count);
                const optionKey = `${capacity.component_id}-${capacity.option_value}`;
                
                return (
                  <div key={optionKey} className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                         <span className="text-sm text-gray-700">
                           <strong>{capacity.display_text || capacity.option_value}</strong>
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
                           <div className="flex items-center gap-1">
                             <span className="text-xs text-gray-500">participants registered</span>
                             <OptionSubmissionsDropdown 
                               formId={form.id} 
                               componentId={capacity.component_id} 
                               optionValue={capacity.option_value} 
                             />
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


        {/* Waitlist information */}
        {waitlistCount > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded text-orange-700 text-sm">
              <Clock className="h-4 w-4" />
              <span>
                <strong>{waitlistCount}</strong> family{waitlistCount !== 1 ? 'ies' : ''} currently on the waitlist
              </span>
            </div>
          </div>
        )}

        {/* Information about accepting submissions */}
        {isFormFull && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            This form is at capacity, but you can still submit to join the waitlist.
          </div>
        )}
      </div>
    </div>
  );
};