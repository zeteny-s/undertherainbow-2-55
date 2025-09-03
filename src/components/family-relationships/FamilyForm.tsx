import React, { useState } from 'react';
import { X, Users, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Family } from '../../types/family-relationships';

interface FamilyFormProps {
  family?: Family | null;
  onSubmit: (data: Partial<Family>) => void;
  onClose: () => void;
}

export const FamilyForm: React.FC<FamilyFormProps> = ({
  family,
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: family?.name || '',
    child_name: family?.child_name || '',
    child_age: family?.child_age || '',
    start_date: family?.start_date 
      ? format(new Date(family.start_date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    notes: family?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      child_age: formData.child_age ? parseInt(formData.child_age.toString()) : undefined,
    };

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {family ? 'Család szerkesztése' : 'Új család hozzáadása'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Family Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4 inline mr-1" />
              Család neve *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="pl. Kovács család"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>

          {/* Child Name */}
          <div>
            <label htmlFor="child_name" className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Gyermek neve
            </label>
            <input
              type="text"
              id="child_name"
              value={formData.child_name}
              onChange={(e) => setFormData(prev => ({ ...prev, child_name: e.target.value }))}
              placeholder="pl. Kovács Anna"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Child Age */}
          <div>
            <label htmlFor="child_age" className="block text-sm font-medium text-gray-700 mb-2">
              Gyermek kora (évben)
            </label>
            <input
              type="number"
              id="child_age"
              min="0"
              max="10"
              value={formData.child_age}
              onChange={(e) => setFormData(prev => ({ ...prev, child_age: e.target.value }))}
              placeholder="pl. 3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Kapcsolatépítés kezdete
            </label>
            <input
              type="date"
              id="start_date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Jegyzetek
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Speciális információk a családról..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Mégse
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              {family ? 'Frissítés' : 'Hozzáadás'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};