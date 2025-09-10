import React, { useState } from 'react';
import { Search, Type, AlignLeft, ChevronDown, CheckSquare, Circle, Upload, Minus } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComponentLibraryItem, ComponentType } from '@/types/form-types';

const componentLibrary: ComponentLibraryItem[] = [
  {
    type: 'text-input',
    name: 'Szöveges beviteli mező',
    icon: 'Type',
    description: 'Egysoros szöveges beviteli mező',
    defaultConfig: {
      placeholder: 'Írja be a szöveget...',
      required: false
    }
  },
  {
    type: 'textarea',
    name: 'Hosszú szöveges mező',
    icon: 'AlignLeft',
    description: 'Többsoros szöveges beviteli terület',
    defaultConfig: {
      placeholder: 'Írja be a hosszabb szöveget...',
      required: false
    }
  },
  {
    type: 'dropdown',
    name: 'Legördülő menü',
    icon: 'ChevronDown',
    description: 'Opciók közül választható legördülő menü',
    defaultConfig: {
      options: ['1. opció', '2. opció', '3. opció'],
      required: false
    }
  },
  {
    type: 'checkbox',
    name: 'Jelölőnégyzetek',
    icon: 'CheckSquare',
    description: 'Több opció kiválasztható',
    defaultConfig: {
      options: ['1. opció', '2. opció', '3. opció'],
      required: false
    }
  },
  {
    type: 'radio',
    name: 'Választógombok',
    icon: 'Circle',
    description: 'Egy opció kiválasztható',
    defaultConfig: {
      options: ['1. opció', '2. opció', '3. opció'],
      required: false
    }
  },
  {
    type: 'file-upload',
    name: 'Fájl feltöltés',
    icon: 'Upload',
    description: 'Fájlok feltöltése',
    defaultConfig: {
      required: false,
      acceptedTypes: 'image/*,application/pdf'
    }
  },
  {
    type: 'text-block',
    name: 'Szöveges blokk',
    icon: 'Type',
    description: 'Információs szöveg megjelenítése',
    defaultConfig: {
      content: 'Információs szöveg...'
    }
  },
  {
    type: 'divider',
    name: 'Elválasztó vonal',
    icon: 'Minus',
    description: 'Vizuális elválasztó elem',
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
        isDragging ? 'opacity-50 border-primary' : 'border-border hover:border-primary/50'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
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
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComponents = componentLibrary.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{t('newsforms.componentLibrary')}</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('newsforms.searchComponents')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          {t('newsforms.dragToAdd')}
        </p>
        
        {filteredComponents.map((item) => (
          <DraggableComponent key={item.type} item={item} />
        ))}
        
        {filteredComponents.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {t('newsforms.noComponentsFound')}
            </p>
          </div>
        )}
      </CardContent>
    </div>
  );
};