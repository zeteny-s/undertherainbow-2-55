import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Star, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Family, FamilyInteraction, InteractionCategory, INTERACTION_CATEGORIES, getCategoryInfo } from '../../types/family-relationships';

interface InteractionFormProps {
  family: Family;
  interaction?: FamilyInteraction | null;
  onSubmit: (data: Partial<FamilyInteraction>) => void;
  onCancel: () => void;
}

export const InteractionForm: React.FC<InteractionFormProps> = ({
  family,
  interaction,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    interaction_date: interaction?.interaction_date 
      ? format(new Date(interaction.interaction_date), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    category: interaction?.category || 'daily_interaction' as InteractionCategory,
    duration_minutes: interaction?.duration_minutes || 2,
    location: interaction?.location || '',
    notes: interaction?.notes || '',
    satisfaction_level: interaction?.satisfaction_level || 3,
    referral_opportunity: interaction?.referral_opportunity || false,
    next_steps: interaction?.next_steps || '',
  });

  const [isQuickAdd, setIsQuickAdd] = useState(false);

  useEffect(() => {
    // Update duration when category changes
    const categoryInfo = getCategoryInfo(formData.category);
    if (!interaction) { // Only for new interactions
      setFormData(prev => ({
        ...prev,
        duration_minutes: categoryInfo.defaultDuration
      }));
    }
  }, [formData.category, interaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      interaction_date: new Date(formData.interaction_date).toISOString(),
      satisfaction_level: formData.satisfaction_level || undefined,
    };

    onSubmit(submitData);
  };

  const handleCategoryChange = (category: InteractionCategory) => {
    const categoryInfo = getCategoryInfo(category);
    setFormData(prev => ({
      ...prev,
      category,
      duration_minutes: categoryInfo.defaultDuration
    }));
  };

  const categoryInfo = getCategoryInfo(formData.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {interaction ? 'Interakció szerkesztése' : 'Új interakció hozzáadása'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Family info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900">{family.name}</h3>
            {family.child_name && (
              <p className="text-sm text-gray-600 mt-1">
                {family.child_name}
                {family.child_age && ` (${family.child_age} éves)`}
              </p>
            )}
          </div>

          {/* Quick Add Toggle */}
          {!interaction && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="quickAdd"
                checked={isQuickAdd}
                onChange={(e) => setIsQuickAdd(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="quickAdd" className="text-sm text-gray-700">
                Gyors hozzáadás (csak a lényeg)
              </label>
            </div>
          )}

          {/* Date and Time */}
          <div>
            <label htmlFor="interaction_date" className="block text-sm font-medium text-gray-700 mb-2">
              Dátum és idő *
            </label>
            <input
              type="datetime-local"
              id="interaction_date"
              value={formData.interaction_date}
              onChange={(e) => setFormData(prev => ({ ...prev, interaction_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Kategória *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERACTION_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                    formData.category === cat.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {cat.emoji} {cat.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {cat.defaultDuration} perc
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {cat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Időtartam (perc) *
            </label>
            <input
              type="number"
              id="duration_minutes"
              min="1"
              max="300"
              value={formData.duration_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Alapértelmezett: {categoryInfo.defaultDuration} perc
            </p>
          </div>

          {!isQuickAdd && (
            <>
              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Helyszín
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="pl. átvétel, osztályterem, telefon"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Satisfaction Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="h-4 w-4 inline mr-1" />
                  Szülői elégedettség (1-5)
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, satisfaction_level: rating }))}
                      className={`p-1 rounded transition-colors ${
                        rating <= formData.satisfaction_level
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    >
                      <Star className={`h-6 w-6 ${rating <= formData.satisfaction_level ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {formData.satisfaction_level}/5
                  </span>
                </div>
              </div>

              {/* Referral Opportunity */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.referral_opportunity}
                    onChange={(e) => setFormData(prev => ({ ...prev, referral_opportunity: e.target.checked }))}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Ajánlási lehetőség került szóba
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              <MessageCircle className="h-4 w-4 inline mr-1" />
              Jegyzetek {isQuickAdd && '*'}
            </label>
            <textarea
              id="notes"
              rows={isQuickAdd ? 3 : 4}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Mit beszéltetek meg? Milyen volt a hangulat?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary resize-none"
              required={isQuickAdd}
            />
          </div>

          {!isQuickAdd && (
            <div>
              <label htmlFor="next_steps" className="block text-sm font-medium text-gray-700 mb-2">
                Következő lépések
              </label>
              <textarea
                id="next_steps"
                rows={2}
                value={formData.next_steps}
                onChange={(e) => setFormData(prev => ({ ...prev, next_steps: e.target.value }))}
                placeholder="Mit tervezel a következő alkalomra?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Mégse
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              {interaction ? 'Frissítés' : 'Hozzáadás'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};