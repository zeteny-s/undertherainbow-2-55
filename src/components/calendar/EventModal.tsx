import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Palette } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

interface CalendarEvent {
  id?: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  color: string | null;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  selectedDate?: Date;
  onEventSaved: () => void;
  onEventDeleted?: () => void;
}

const colorOptions = [
  { name: 'Kék', value: '#3b82f6' },
  { name: 'Zöld', value: '#10b981' },
  { name: 'Lila', value: '#8b5cf6' },
  { name: 'Rózsaszín', value: '#ec4899' },
  { name: 'Narancs', value: '#f59e0b' },
  { name: 'Piros', value: '#ef4444' },
  { name: 'Türkiz', value: '#06b6d4' },
  { name: 'Szürke', value: '#6b7280' }
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  selectedDate,
  onEventSaved,
  onEventDeleted
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CalendarEvent>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    all_day: false,
    location: '',
    color: '#3b82f6'
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode
        setFormData({
          ...event,
          description: event.description || '',
          location: event.location || '',
          color: event.color || '#3b82f6'
        });
      } else {
        // Create mode
        const now = new Date();
        const defaultDate = selectedDate || now;
        const startTime = new Date(defaultDate);
        startTime.setHours(now.getHours() + 1, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1);

        setFormData({
          title: '',
          description: '',
          start_time: startTime.toISOString().slice(0, 16),
          end_time: endTime.toISOString().slice(0, 16),
          all_day: false,
          location: '',
          color: '#3b82f6'
        });
      }
    }
  }, [isOpen, event, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.title.trim()) return;

    setLoading(true);
    try {
      const eventData = {
        ...formData,
        user_id: user.id,
        description: formData.description || null,
        location: formData.location || null
      };

      if (event?.id) {
        // Update existing event
        const { error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;
      } else {
        // Create new event
        const { error } = await supabase
          .from('calendar_events')
          .insert(eventData);

        if (error) throw error;
      }

      onEventSaved();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Hiba történt az esemény mentése során.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;
      
      onEventDeleted?.();
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Hiba történt az esemény törlése során.');
    } finally {
      setLoading(false);
    }
  };

  const handleAllDayToggle = (allDay: boolean) => {
    setFormData(prev => {
      if (allDay) {
        const date = new Date(prev.start_time);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59);
        
        return {
          ...prev,
          all_day: true,
          start_time: startOfDay.toISOString().slice(0, 16),
          end_time: endOfDay.toISOString().slice(0, 16)
        };
      } else {
        return {
          ...prev,
          all_day: false
        };
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {event ? 'Esemény szerkesztése' : 'Új esemény'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Esemény címe *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Írja be az esemény címét..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leírás
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Esemény leírása..."
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.all_day}
              onChange={(e) => handleAllDayToggle(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
              Egész napos esemény
            </label>
          </div>

          {/* Time inputs */}
          {!formData.all_day && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Kezdés
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Befejezés
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Helyszín
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Esemény helyszíne..."
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Szín
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    formData.color === color.value ? 'border-gray-400 scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between pt-4">
            {event && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Törlés
              </button>
            )}
            
            <div className="flex space-x-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Mentés...' : (event ? 'Frissítés' : 'Mentés')}
              </button>
            </div>
          </div>
        </form>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white rounded-xl flex items-center justify-center">
            <div className="text-center p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Biztos törli az eseményt?
              </h3>
              <p className="text-gray-600 mb-6">
                Ez a művelet nem vonható vissza.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Mégse
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
                >
                  {loading ? 'Törlés...' : 'Törlés'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};