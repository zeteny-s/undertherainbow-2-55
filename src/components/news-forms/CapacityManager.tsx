import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Settings, Users, AlertCircle } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { Form, FormComponent } from '../../types/form-types';

interface CapacityManagerProps {
  form: Form;
  onClose: () => void;
}

interface OptionCapacity {
  id?: string;
  component_id: string;
  option_value: string;
  max_capacity: number;
  current_count: number;
  display_text?: string | null;
}

export const CapacityManager = ({ form, onClose }: CapacityManagerProps) => {
  const [capacities, setCapacities] = useState<OptionCapacity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapacities();
  }, [form.id]);

  const fetchCapacities = async () => {
    try {
      const { data, error } = await supabase
        .from('form_option_capacity')
        .select('*')
        .eq('form_id', form.id);

      if (error) throw error;

      setCapacities(data || []);
    } catch (error) {
      console.error('Error fetching capacities:', error);
      toast.error('Failed to load capacity settings');
    } finally {
      setLoading(false);
    }
  };

  const getSelectOptions = (component: FormComponent): string[] => {
    if (component.type === 'dropdown' && component.options) {
      return component.options;
    }
    if (component.type === 'checkbox' && component.options) {
      return component.options;
    }
    if (component.type === 'radio' && component.options) {
      return component.options;
    }
    return [];
  };

  const getCapacityForOption = (componentId: string, optionValue: string): OptionCapacity | null => {
    return capacities.find(c => c.component_id === componentId && c.option_value === optionValue) || null;
  };

  const updateCapacity = async (componentId: string, optionValue: string, maxCapacity: number, displayText?: string) => {
    if (maxCapacity < 0) return;

    try {
      const existing = getCapacityForOption(componentId, optionValue);
      
      if (maxCapacity === 0) {
        // Remove capacity limit
        if (existing?.id) {
          const { error } = await supabase
            .from('form_option_capacity')
            .delete()
            .eq('id', existing.id);

          if (error) throw error;

          setCapacities(prev => prev.filter(c => c.id !== existing.id));
        }
      } else {
        // Set or update capacity limit
        if (existing?.id) {
          const { error } = await supabase
            .from('form_option_capacity')
            .update({ 
              max_capacity: maxCapacity,
              display_text: displayText || null
            })
            .eq('id', existing.id);

          if (error) throw error;

          setCapacities(prev => prev.map(c => 
            c.id === existing.id ? { ...c, max_capacity: maxCapacity } : c
          ));
        } else {
          const { data, error } = await supabase
            .from('form_option_capacity')
            .insert({
              form_id: form.id,
              component_id: componentId,
              option_value: optionValue,
              max_capacity: maxCapacity,
              current_count: 0,
              display_text: displayText || null
            })
            .select()
            .single();

          if (error) throw error;

          setCapacities(prev => [...prev, data]);
        }
      }

      toast.success('Capacity updated successfully');
    } catch (error) {
      console.error('Error updating capacity:', error);
      toast.error('Failed to update capacity');
    }
  };

  const eligibleComponents = form.form_components.filter(comp => 
    ['dropdown', 'checkbox', 'radio'].includes(comp.type) && comp.options && comp.options.length > 0
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl border">
        <div className="p-6 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Capacity Management</h2>
                <p className="text-sm text-muted-foreground">Set capacity limits for form options</p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6 bg-white">
          {eligibleComponents.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="p-8 text-center bg-white">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Eligible Components</h3>
                <p className="text-muted-foreground">
                  This form doesn't have any dropdown, checkbox, or radio components that support capacity limits.
                </p>
              </CardContent>
            </Card>
          ) : (
            eligibleComponents.map((component) => (
              <Card key={component.id} className="bg-white">
                <CardHeader className="bg-white">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {component.label}
                    <Badge variant="secondary">{component.type}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 bg-white">
                  {getSelectOptions(component).map((option) => {
                    const capacity = getCapacityForOption(component.id, option);
                    const currentCapacity = capacity?.max_capacity || 0;
                    const currentCount = capacity?.current_count || 0;
                    
                    return (
                      <div key={option} className="space-y-3 p-4 border rounded-lg bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{option}</div>
                            {capacity && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={currentCount >= currentCapacity ? "destructive" : "secondary"}>
                                  {currentCount} / {currentCapacity} participants
                                </Badge>
                                {currentCount >= currentCapacity && (
                                  <span className="text-sm text-destructive">Full</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Label htmlFor={`capacity-${component.id}-${option}`} className="text-sm">
                              Max capacity:
                            </Label>
                            <Input
                              id={`capacity-${component.id}-${option}`}
                              type="number"
                              min="0"
                              max="999"
                              value={currentCapacity}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                updateCapacity(component.id, option, value);
                              }}
                              className="w-20"
                              placeholder="0"
                            />
                            <div className="text-xs text-muted-foreground">
                              (0 = unlimited)
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Label htmlFor={`display-${component.id}-${option}`} className="text-sm">
                            Display text:
                          </Label>
                          <Input
                            id={`display-${component.id}-${option}`}
                            type="text"
                            value={capacity?.display_text || ''}
                            onChange={(e) => {
                              updateCapacity(component.id, option, currentCapacity, e.target.value);
                            }}
                            className="flex-1"
                            placeholder={`Short text for "${option}"`}
                          />
                          <div className="text-xs text-muted-foreground">
                            (optional)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};