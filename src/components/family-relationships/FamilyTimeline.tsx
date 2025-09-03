import React, { useState } from 'react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Edit2, Trash2, Clock, MapPin, Star, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { FamilyInteraction, getCategoryInfo } from '../../types/family-relationships';

interface FamilyTimelineProps {
  interactions: FamilyInteraction[];
  onEditInteraction: (interaction: FamilyInteraction) => void;
  onDeleteInteraction: (interactionId: string) => void;
}

export const FamilyTimeline: React.FC<FamilyTimelineProps> = ({
  interactions,
  onEditInteraction,
  onDeleteInteraction,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleDeleteInteraction = (interactionId: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt az interakciót?')) {
      onDeleteInteraction(interactionId);
    }
  };

  if (interactions.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Még nincs interakció
        </h3>
        <p className="text-gray-500">
          Kezdj el építeni a kapcsolatot ezzel a családdal az első interakció hozzáadásával.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">
          {interactions.length} interakció
        </div>
        <div className="text-sm text-gray-500">
          Összesen: {interactions.reduce((sum, int) => sum + int.duration_minutes, 0)} perc
        </div>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-6">
          {interactions.map((interaction, index) => {
            const categoryInfo = getCategoryInfo(interaction.category);
            const isExpanded = expandedItems.has(interaction.id);
            const isFirst = index === 0;

            return (
              <div key={interaction.id} className="relative">
                {/* Timeline dot */}
                <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                  isFirst 
                    ? 'bg-primary ring-2 ring-primary/20' 
                    : 'bg-gray-300'
                }`}></div>

                {/* Content */}
                <div className="ml-12">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleExpanded(interaction.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryInfo.color}`}>
                              {categoryInfo.emoji} {categoryInfo.label}
                            </span>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {interaction.duration_minutes} perc
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {format(new Date(interaction.interaction_date), 'yyyy. MMMM d. (eeee)', { locale: hu })}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(interaction.interaction_date), 'HH:mm')}
                                {interaction.location && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <MapPin className="h-3 w-3 inline mr-1" />
                                    {interaction.location}
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              {interaction.satisfaction_level && (
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < interaction.satisfaction_level!
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                              {interaction.referral_opportunity && (
                                <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                              )}
                            </div>
                          </div>

                          {/* Preview */}
                          {interaction.notes && !isExpanded && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {interaction.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-1 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditInteraction(interaction);
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Szerkesztés"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInteraction(interaction.id);
                            }}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Törlés"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="pt-4 space-y-3">
                          {interaction.notes && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-700 mb-1">Jegyzetek</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {interaction.notes}
                              </p>
                            </div>
                          )}

                          {interaction.next_steps && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-700 mb-1">Következő lépések</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {interaction.next_steps}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
                            <span>
                              Kategória leírás: {categoryInfo.description}
                            </span>
                            {interaction.referral_opportunity && (
                              <div className="flex items-center text-green-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Ajánlási lehetőség azonosítva
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};