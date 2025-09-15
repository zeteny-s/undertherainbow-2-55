import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit3, Trash2, GripVertical } from 'lucide-react';
import { NewsletterComponent } from '../../../types/newsletter-builder-types';

interface SortableNewsletterComponentProps {
  component: NewsletterComponent;
  children: React.ReactNode;
  onSelect: (component: NewsletterComponent) => void;
  onDelete: (componentId: string) => void;
}

export const SortableNewsletterComponent: React.FC<SortableNewsletterComponentProps> = ({
  component,
  children,
  onSelect,
  onDelete
}) => {
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
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative border-2 border-green-500 bg-green-50 rounded-lg p-2 mb-2"
    >
      {/* Simplified controls - always visible for debugging */}
      <div className="flex justify-between items-center mb-2 bg-gray-100 p-2 rounded">
        <button
          {...attributes}
          {...listeners}
          className="p-1 bg-blue-500 text-white rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={() => onSelect(component)}
            className="p-1 bg-blue-500 text-white rounded"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(component.id)}
            className="p-1 bg-red-500 text-white rounded"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Component content */}
      <div className="relative bg-white border border-gray-300 rounded p-2">
        <div className="text-xs text-gray-500 mb-2">Type: {component.type}</div>
        {children}
      </div>
    </div>
  );
};