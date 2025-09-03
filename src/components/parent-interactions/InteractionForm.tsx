import React, { useState, useEffect } from 'react';
import { CalendarIcon, X, Star, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { InteractionType, InteractionForm as InteractionFormData } from '@/types/parent-interactions';

interface InteractionFormProps {
  interactionTypes: InteractionType[];
  onSubmit: (data: InteractionFormData) => void;
  initialData?: InteractionFormData;
  onCancel?: () => void;
  isEditing?: boolean;
}

export const InteractionForm: React.FC<InteractionFormProps> = ({
  interactionTypes,
  onSubmit,
  initialData,
  onCancel,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<InteractionFormData>({
    interaction_type_id: '',
    interaction_date: new Date(),
    title: '',
    description: '',
    participants: [],
    key_topics: [],
    action_items: [],
    follow_up_date: undefined,
    quality_rating: undefined,
    cultural_notes: '',
    duration_minutes: undefined
  });

  const [newParticipant, setNewParticipant] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newAction, setNewAction] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    if (!isEditing) {
      // Reset form after creating new interaction
      setFormData({
        interaction_type_id: '',
        interaction_date: new Date(),
        title: '',
        description: '',
        participants: [],
        key_topics: [],
        action_items: [],
        follow_up_date: undefined,
        quality_rating: undefined,
        cultural_notes: '',
        duration_minutes: undefined
      });
    }
  };

  const addParticipant = () => {
    if (newParticipant.trim()) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, newParticipant.trim()]
      }));
      setNewParticipant('');
    }
  };

  const removeParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const addTopic = () => {
    if (newTopic.trim()) {
      setFormData(prev => ({
        ...prev,
        key_topics: [...prev.key_topics, newTopic.trim()]
      }));
      setNewTopic('');
    }
  };

  const removeTopic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      key_topics: prev.key_topics.filter((_, i) => i !== index)
    }));
  };

  const addAction = () => {
    if (newAction.trim()) {
      setFormData(prev => ({
        ...prev,
        action_items: [...prev.action_items, newAction.trim()]
      }));
      setNewAction('');
    }
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      action_items: prev.action_items.filter((_, i) => i !== index)
    }));
  };

  const selectedType = interactionTypes.find(t => t.id === formData.interaction_type_id);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between mb-6 p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Interaction' : 'New Parent Interaction'}
        </h3>
        {isEditing && onCancel && (
          <button
            onClick={onCancel}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 pb-4 space-y-4 overflow-y-auto">
        {/* Interaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interaction Type
          </label>
          <select
            value={formData.interaction_type_id}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
              setFormData(prev => ({ ...prev, interaction_type_id: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select interaction type</option>
            {interactionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.hour_value}h)
              </option>
            ))}
          </select>
          {selectedType && (
            <p className="text-xs text-gray-500 mt-1">
              {selectedType.description}
            </p>
          )}
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interaction Date
            </label>
            <input
              type="datetime-local"
              value={format(formData.interaction_date, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setFormData(prev => ({ ...prev, interaction_date: new Date(e.target.value) }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              placeholder="Optional"
              value={formData.duration_minutes || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setFormData(prev => ({ 
                  ...prev, 
                  duration_minutes: e.target.value ? parseInt(e.target.value) : undefined 
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            placeholder="Brief title for this interaction"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setFormData(prev => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            placeholder="Detailed description of the interaction..."
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
              setFormData(prev => ({ ...prev, description: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-20"
            required
          />
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Participants
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add participant"
              value={newParticipant}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewParticipant(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button 
              type="button" 
              onClick={addParticipant}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {formData.participants.map((participant: string, index: number) => (
              <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs">
                {participant}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
                  onClick={() => removeParticipant(index)}
                />
              </span>
            ))}
          </div>
        </div>

        {/* Key Topics */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Key Topics
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add key topic"
              value={newTopic}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTopic(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button 
              type="button" 
              onClick={addTopic}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {formData.key_topics.map((topic: string, index: number) => (
              <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                {topic}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
                  onClick={() => removeTopic(index)}
                />
              </span>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Action Items
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add action item"
              value={newAction}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAction(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && (e.preventDefault(), addAction())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button 
              type="button" 
              onClick={addAction}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {formData.action_items.map((action: string, index: number) => (
              <div key={index} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded">
                <span className="flex-1">{action}</span>
                <X 
                  className="w-3 h-3 cursor-pointer text-gray-500 hover:text-red-500" 
                  onClick={() => removeAction(index)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Follow-up Date (Optional)
          </label>
          <input
            type="date"
            value={formData.follow_up_date ? format(formData.follow_up_date, 'yyyy-MM-dd') : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setFormData(prev => ({ 
                ...prev, 
                follow_up_date: e.target.value ? new Date(e.target.value) : undefined 
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Quality Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quality Rating (Optional)
          </label>
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`w-6 h-6 cursor-pointer transition-colors ${
                  (formData.quality_rating || 0) > index
                    ? "text-yellow-500 fill-current"
                    : "text-gray-300 hover:text-yellow-400"
                }`}
                onClick={() => 
                  setFormData(prev => ({ 
                    ...prev, 
                    quality_rating: index + 1 === formData.quality_rating ? undefined : index + 1 
                  }))
                }
              />
            ))}
            {formData.quality_rating && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, quality_rating: undefined }))}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Cultural Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cultural Notes (Optional)
          </label>
          <textarea
            placeholder="Any cultural considerations or notes..."
            value={formData.cultural_notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
              setFormData(prev => ({ ...prev, cultural_notes: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-16"
          />
        </div>

        <button 
          type="submit" 
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
          disabled={!formData.title || !formData.description || !formData.interaction_type_id}
        >
          {isEditing ? 'Update Interaction' : 'Create Interaction'}
        </button>
      </form>
    </div>
  );
};