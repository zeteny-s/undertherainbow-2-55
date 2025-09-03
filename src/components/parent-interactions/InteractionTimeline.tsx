import React from 'react';
import { formatDateTime } from '@/utils/formatters';
import { Edit, Trash2, Star, Calendar, Clock, Users, MessageSquare, CheckCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { ParentInteraction } from '@/types/parent-interactions';

interface InteractionTimelineProps {
  interactions: ParentInteraction[];
  onEdit: (interaction: ParentInteraction) => void;
  onDelete: (id: string) => void;
}

export const InteractionTimeline: React.FC<InteractionTimelineProps> = ({
  interactions,
  onEdit,
  onDelete
}) => {
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || MessageSquare;
  };

  const renderQualityRating = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`w-3 h-3 ${
              index < rating 
                ? 'text-yellow-500 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatFollowUpDate = (date?: string) => {
    if (!date) return null;
    const followUpDate = new Date(date);
    const today = new Date();
    const isOverdue = followUpDate < today;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${
        isOverdue ? 'text-red-600' : 'text-gray-500'
      }`}>
        <Calendar className="w-3 h-3" />
        <span>Follow-up: {followUpDate.toLocaleDateString()}</span>
        {isOverdue && <span className="text-red-600 font-medium">(Overdue)</span>}
      </div>
    );
  };

  if (interactions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Interactions Yet</h3>
          <p className="text-gray-500">
            Start by creating your first parent interaction using the form on the right.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />
        
        {interactions.map((interaction) => {
          const Icon = getIcon(interaction.interaction_types?.icon || 'MessageSquare');
          const tierColor = interaction.interaction_types?.color || '#3B82F6';
          
          return (
            <div key={interaction.id} className="relative flex gap-4 pb-8">
              {/* Timeline dot with icon */}
              <div
                className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 border-white shadow-md"
                style={{ backgroundColor: tierColor }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Content card */}
              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">
                      {interaction.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(interaction.interaction_date)}</span>
                      </div>
                      {interaction.duration_minutes && (
                        <span>{interaction.duration_minutes} min</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: `${tierColor}20`,
                        color: tierColor,
                        border: `1px solid ${tierColor}40`
                      }}
                    >
                      {interaction.hour_value}h
                    </span>
                    {renderQualityRating(interaction.quality_rating)}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                  {interaction.description}
                </p>

                {/* Participants */}
                {interaction.participants.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div className="flex flex-wrap gap-1">
                      {interaction.participants.map((participant: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs">
                          {participant}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Topics */}
                {interaction.key_topics.length > 0 && (
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-1">
                      {interaction.key_topics.map((topic: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {interaction.action_items.length > 0 && (
                  <div className="mb-2">
                    <h5 className="text-xs font-medium text-gray-500 mb-1">Action Items:</h5>
                    <ul className="space-y-1">
                      {interaction.action_items.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cultural Notes */}
                {interaction.cultural_notes && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded text-xs">
                    <span className="font-medium text-gray-600">Cultural Notes: </span>
                    <span className="text-gray-600">{interaction.cultural_notes}</span>
                  </div>
                )}

                {/* Follow-up date */}
                {interaction.follow_up_date && (
                  <div className="mb-3">
                    {formatFollowUpDate(interaction.follow_up_date)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => onEdit(interaction)}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(interaction.id)}
                    className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </button>
                  
                  <div className="ml-auto text-xs text-gray-500">
                    {interaction.interaction_types?.name}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};