import React, { useState } from 'react';
import { Plus, Minus, Calendar, Clock, Users, MessageSquare, Star } from 'lucide-react';
import type { InteractionType, InteractionForm as InteractionFormData } from '../../types/parent-interactions';

interface InteractionFormProps {
  interactionTypes: InteractionType[];
  onSubmit: (data: InteractionFormData) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export const InteractionForm: React.FC<InteractionFormProps> = ({
  interactionTypes,
  onSubmit,
  onCancel,
  isEditing
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
  const [newActionItem, setNewActionItem] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    
    // Reset form
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

  const addActionItem = () => {
    if (newActionItem.trim()) {
      setFormData(prev => ({
        ...prev,
        action_items: [...prev.action_items, newActionItem.trim()]
      }));
      setNewActionItem('');
    }
  };

  const removeActionItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      action_items: prev.action_items.filter((_, i) => i !== index)
    }));
  };

  const selectedType = interactionTypes.find(t => t.id === formData.interaction_type_id);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Interaction' : 'New Interaction'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interaction Type *
          </label>
          <select
            value={formData.interaction_type_id}
            onChange={(e) => setFormData(prev => ({ ...prev, interaction_type_id: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select type...</option>
            {interactionTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name} (Tier {type.tier} - {type.hour_value}h)
              </option>
            ))}
          </select>
          {selectedType && selectedType.description && (
            <p className="text-xs text-gray-500 mt-1">{selectedType.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date *
            </label>
            <input
              type="date"
              value={formData.interaction_date.toISOString().split('T')[0]}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                interaction_date: new Date(e.target.value) 
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.duration_minutes || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                duration_minutes: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief title for this interaction"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what happened during this interaction"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Participants
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add participant name"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
            />
            <button
              type="button"
              onClick={addParticipant}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.participants.map((participant, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-sm"
              >
                {participant}
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key Topics
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add topic discussed"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
            />
            <button
              type="button"
              onClick={addTopic}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.key_topics.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => removeTopic(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action Items
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newActionItem}
              onChange={(e) => setNewActionItem(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add action item"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActionItem())}
            />
            <button
              type="button"
              onClick={addActionItem}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.action_items.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-sm text-green-700"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeActionItem(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Follow-up Date
          </label>
          <input
            type="date"
            value={formData.follow_up_date?.toISOString().split('T')[0] || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              follow_up_date: e.target.value ? new Date(e.target.value) : undefined 
            }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Star className="w-4 h-4 inline mr-1" />
            Quality Rating
          </label>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  quality_rating: index + 1 
                }))}
                className={`p-1 ${
                  formData.quality_rating && index < formData.quality_rating
                    ? 'text-yellow-500'
                    : 'text-gray-300'
                }`}
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cultural Notes
          </label>
          <textarea
            value={formData.cultural_notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, cultural_notes: e.target.value }))}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any cultural considerations or notes"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            {isEditing ? 'Update Interaction' : 'Create Interaction'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};