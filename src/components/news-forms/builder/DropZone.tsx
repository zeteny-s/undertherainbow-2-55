import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Trash2, Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormComponent } from '@/types/form-types';
import { SortableFormComponent } from './SortableFormComponent';

interface DropZoneProps {
  components: FormComponent[];
  onComponentSelect: (component: FormComponent) => void;
  onComponentDelete: (componentId: string) => void;
}

export const DropZone = ({ components, onComponentSelect, onComponentDelete }: DropZoneProps) => {
  const { t } = useTranslation();
  const { isOver, setNodeRef } = useDroppable({
    id: 'form-builder-dropzone'
  });

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <h2 className="font-semibold">{t('newsforms.formCanvas')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('newsforms.dragComponentsHere')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            className={`min-h-full space-y-4 ${
              isOver ? 'bg-primary/5 border-2 border-dashed border-primary rounded-lg' : ''
            }`}
          >
            {components.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t('newsforms.emptyCanvas')}</h3>
                <p className="text-muted-foreground max-w-md">
                  {t('newsforms.emptyCanvasDescription')}
                </p>
              </div>
            ) : (
              components.map((component) => (
                <SortableFormComponent
                  key={component.id}
                  component={component}
                  onSelect={() => onComponentSelect(component)}
                  onDelete={() => onComponentDelete(component.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};