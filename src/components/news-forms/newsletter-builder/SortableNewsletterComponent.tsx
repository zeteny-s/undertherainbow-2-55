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
      className="group relative border border-transparent hover:border-blue-300 hover:bg-blue-50/30 rounded-lg p-2 transition-all"
    >
      {/* Drag handle and controls */}
      <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
        <button
          {...attributes}
          {...listeners}
          className="p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
        <button
          onClick={() => onSelect(component)}
          className="p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-blue-50"
        >
          <Edit3 className="h-4 w-4 text-blue-600" />
        </button>
        <button
          onClick={() => onDelete(component.id)}
          className="p-2 bg-white border border-gray-200 rounded shadow-sm hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </button>
      </div>

      {/* Component content */}
      <div className="pointer-events-none">
        {children}
      </div>
    </div>
  );
};