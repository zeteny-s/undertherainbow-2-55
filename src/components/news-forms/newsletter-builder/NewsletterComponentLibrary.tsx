import React from 'react';
import { Type, Image, Minus, MousePointer, Heading1, Calendar } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '../../ui/card';
import { NewsletterComponentType } from '../../../types/newsletter-builder-types';

interface ComponentLibraryItem {
  type: NewsletterComponentType;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  defaultConfig: any;
}

const componentLibrary: ComponentLibraryItem[] = [
  {
    type: 'heading',
    name: 'Heading',
    icon: Heading1,
    description: 'Add titles and headings',
    defaultConfig: {
      text: 'Your Heading Here',
      level: 2,
      textAlign: 'left',
      color: '#1f2937'
    }
  },
  {
    type: 'text-block',
    name: 'Text Block',
    icon: Type,
    description: 'Add paragraphs and content',
    defaultConfig: {
      content: 'Add your content here...',
      fontSize: '16px',
      fontWeight: 'normal',
      textAlign: 'left',
      color: '#374151'
    }
  },
  {
    type: 'image',
    name: 'Image',
    icon: Image,
    description: 'Add images to your newsletter',
    defaultConfig: {
      url: '',
      alt: 'Newsletter image',
      width: '100%',
      height: 'auto'
    }
  },
  {
    type: 'button',
    name: 'Button',
    icon: MousePointer,
    description: 'Add call-to-action buttons',
    defaultConfig: {
      text: 'Click Here',
      url: '#',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      size: 'medium'
    }
  },
  {
    type: 'divider',
    name: 'Divider',
    icon: Minus,
    description: 'Add visual separation',
    defaultConfig: {
      style: 'solid',
      color: '#e5e7eb',
      thickness: '1px'
    }
  },
  {
    type: 'calendar-button',
    name: 'Calendar Button',
    icon: Calendar,
    description: 'Add Google Calendar button',
    defaultConfig: {
      buttonText: 'Add to my calendar',
      selectedCalendarId: '',
      variant: 'default'
    }
  }
];


interface DraggableComponentProps {
  item: ComponentLibraryItem;
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({ item }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${item.type}`,
    data: {
      type: 'library-item',
      componentType: item.type,
      name: item.name,
      defaultConfig: item.defaultConfig
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1
  } : undefined;

  const IconComponent = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="hover:shadow-md transition-shadow border border-gray-200 bg-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <IconComponent className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const NewsletterComponentLibrary: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Components</h2>
        <p className="text-sm text-gray-600 mt-1">Drag components to add them</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {componentLibrary.map((item) => (
            <DraggableComponent key={item.type} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};