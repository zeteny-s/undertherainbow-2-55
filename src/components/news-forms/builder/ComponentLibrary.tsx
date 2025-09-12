import { useState } from 'react';
import { Search, Type, AlignLeft, ChevronDown, CheckSquare, Circle, Upload, Minus } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ComponentLibraryItem } from '../../../types/form-types';

const componentLibrary: ComponentLibraryItem[] = [
  {
    type: 'text-input',
    name: 'Text Input Field',
    icon: 'Type',
    description: 'Single line text input field',
    defaultConfig: {
      placeholder: 'Enter text...',
      required: false
    }
  },
  {
    type: 'textarea',
    name: 'Long Text Field',
    icon: 'AlignLeft',
    description: 'Multi-line text input area',
    defaultConfig: {
      placeholder: 'Enter longer text...',
      required: false
    }
  },
  {
    type: 'dropdown',
    name: 'Dropdown Menu',
    icon: 'ChevronDown',
    description: 'Dropdown menu with selectable options',
    defaultConfig: {
      options: ['Option 1', 'Option 2', 'Option 3'],
      required: false
    }
  },
  {
    type: 'checkbox',
    name: 'Checkboxes',
    icon: 'CheckSquare',
    description: 'Multiple options can be selected',
    defaultConfig: {
      options: ['Option 1', 'Option 2', 'Option 3'],
      required: false
    }
  },
  {
    type: 'radio',
    name: 'Radio Buttons',
    icon: 'Circle',
    description: 'Single option can be selected',
    defaultConfig: {
      options: ['Option 1', 'Option 2', 'Option 3'],
      required: false
    }
  },
  {
    type: 'file-upload',
    name: 'File Upload',
    icon: 'Upload',
    description: 'Upload files',
    defaultConfig: {
      required: false,
      properties: { acceptedTypes: 'image/*,application/pdf' }
    }
  },
  {
    type: 'text-block',
    name: 'Text Block',
    icon: 'Type',
    description: 'Display informational text',
    defaultConfig: {
      properties: { content: 'Information text...' }
    }
  },
  {
    type: 'divider',
    name: 'Divider Line',
    icon: 'Minus',
    description: 'Visual separator element',
    defaultConfig: {}
  }
];

const iconMap = {
  Type,
  AlignLeft,
  ChevronDown,
  CheckSquare,
  Circle,
  Upload,
  Minus
};

function DraggableComponent({ item }: { item: ComponentLibraryItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${item.type}`,
    data: {
      type: 'library-item',
      componentType: item.type,
      name: item.name,
      defaultConfig: item.defaultConfig
    }
  });

  const IconComponent = iconMap[item.icon as keyof typeof iconMap];

  return (
    <Card 
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md border-2 ${
        isDragging ? 'opacity-50 border-primary' : 'border-border hover:border-primary'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-md">
            <IconComponent className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{item.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const ComponentLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComponents = componentLibrary.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Component Library</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Drag components to add them to your form
        </p>
        
        {filteredComponents.map((item) => (
          <DraggableComponent key={item.type} item={item} />
        ))}
        
        {filteredComponents.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No components found
            </p>
          </div>
        )}
      </CardContent>
    </div>
  );
};