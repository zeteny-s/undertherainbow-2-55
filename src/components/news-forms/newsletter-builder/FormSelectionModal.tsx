import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { FormForSelection } from '../../../types/newsletter-types';
import { supabase } from '../../../integrations/supabase/client';
import { LoadingSpinner } from '../../common/LoadingSpinner';

interface FormSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedForms: FormForSelection[]) => void;
  campus: string;
}

export const FormSelectionModal = ({ isOpen, onClose, onConfirm }: FormSelectionModalProps) => {
  const [availableForms, setAvailableForms] = useState<FormForSelection[]>([]);
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>('all');

  const campusOptions = [
    { value: 'all', label: 'All Campuses' },
    { value: 'Feketerigó', label: 'Feketerigó' },
    { value: 'Torockó', label: 'Torockó' },
    { value: 'Levél', label: 'Levél' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchForms();
    }
  }, [isOpen, selectedCampusFilter]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('forms')
        .select('id, title, description, campuses, created_at')
        .order('created_at', { ascending: false });

      // Apply campus filter if not "all"
      if (selectedCampusFilter !== 'all') {
        query = query.overlaps('campuses', [selectedCampusFilter]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAvailableForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormToggle = (formId: string) => {
    setSelectedFormIds(prev => 
      prev.includes(formId) 
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const handleConfirm = () => {
    const selectedForms = availableForms.filter(form => selectedFormIds.includes(form.id));
    onConfirm(selectedForms);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-white border shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Select Forms for Newsletter</CardTitle>
            <CardDescription>
              Choose which forms to include in your newsletter. They will appear at the bottom.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <div className="px-6 pb-4">
          <Label htmlFor="campus-filter">Filter by Campus</Label>
          <Select value={selectedCampusFilter} onValueChange={setSelectedCampusFilter}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {campusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <CardContent className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : availableForms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No forms available{selectedCampusFilter !== 'all' ? ` for ${selectedCampusFilter}` : ''}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableForms.map((form) => (
                <div key={form.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                  <Checkbox
                    id={form.id}
                    checked={selectedFormIds.includes(form.id)}
                    onCheckedChange={() => handleFormToggle(form.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <label 
                      htmlFor={form.id}
                      className="text-sm font-medium cursor-pointer block"
                    >
                      {form.title}
                    </label>
                    {form.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {form.description}
                      </p>
                    )}
                  </div>
                  {selectedFormIds.includes(form.id) && (
                    <Check className="h-4 w-4 text-green-600 mt-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        
        <div className="flex justify-end gap-2 p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            Continue with {selectedFormIds.length} form{selectedFormIds.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </Card>
    </div>
  );
};