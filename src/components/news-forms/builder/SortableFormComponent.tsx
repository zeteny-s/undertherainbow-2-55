import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings, Trash2, GripVertical } from 'lucide-react';
import { FormComponent } from '../../../types/form-types';

interface SortableFormComponentProps {
  component: FormComponent;
  onSelect: () => void;
  onDelete: () => void;
}

export const SortableFormComponent = ({ component, onSelect, onDelete }: SortableFormComponentProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative transition-all rounded-xl bg-gradient-to-r from-teal-50 to-green-50 border-2 border-teal-200 shadow-sm hover:shadow-md ${
        isDragging ? 'opacity-50 border-teal-400 scale-105' : 'hover:border-teal-300'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 hover:bg-teal-100 rounded-lg transition-colors"
            >
              <GripVertical className="h-4 w-4 text-teal-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm text-gray-800">{component.label}</h4>
              <p className="text-xs text-teal-600 capitalize">{component.type.replace('-', ' ')}</p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={onSelect}
              className="p-2 hover:bg-teal-100 rounded-lg transition-colors text-teal-600 hover:text-teal-800"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button 
              onClick={onDelete} 
              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};