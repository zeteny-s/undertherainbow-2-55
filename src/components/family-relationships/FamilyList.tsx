import React from 'react';
import { Edit2, Trash2, UserCheck, Clock } from 'lucide-react';
import { Family } from '../../types/family-relationships';

interface FamilyListProps {
  families: Family[];
  selectedFamily: Family | null;
  onSelectFamily: (family: Family) => void;
  onEditFamily: (family: Family) => void;
  onDeleteFamily: (familyId: string) => void;
}

export const FamilyList: React.FC<FamilyListProps> = ({
  families,
  selectedFamily,
  onSelectFamily,
  onEditFamily,
  onDeleteFamily,
}) => {
  const handleDeleteFamily = (e: React.MouseEvent, familyId: string, familyName: string) => {
    e.stopPropagation();
    if (window.confirm(`Biztosan törölni szeretnéd a(z) "${familyName}" családot? Ez törli az összes kapcsolódó interakciót is.`)) {
      onDeleteFamily(familyId);
    }
  };

  if (families.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Családok</h2>
        <div className="text-center py-8">
          <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            Még nincs hozzáadva család. Kattintj az "Új Család" gombra a kezdéshez.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Családok ({families.length})
        </h2>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {families.map((family) => (
          <div
            key={family.id}
            onClick={() => onSelectFamily(family)}
            className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedFamily?.id === family.id 
                ? 'bg-primary/5 border-r-2 border-r-primary' 
                : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {family.name}
                </h3>
                {family.child_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    {family.child_name}
                    {family.child_age && ` (${family.child_age} éves)`}
                  </p>
                )}
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {family.start_date 
                    ? `Kezdés: ${new Date(family.start_date).toLocaleDateString('hu-HU')}`
                    : 'Dátum nincs megadva'
                  }
                </div>
              </div>
              
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFamily(family);
                  }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Család szerkesztése"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => handleDeleteFamily(e, family.id, family.name)}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  title="Család törlése"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};