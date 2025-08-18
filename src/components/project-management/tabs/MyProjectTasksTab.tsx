import React from 'react';
import { CheckSquare } from 'lucide-react';

export const MyProjectTasksTab: React.FC = () => {
  return (
    <div className="text-center py-12">
      <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">Projekt feladatok hamarosan</h3>
      <p className="text-muted-foreground">A projekt feladatok funkciók fejlesztés alatt állnak.</p>
    </div>
  );
};