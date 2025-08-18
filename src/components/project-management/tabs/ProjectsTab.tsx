import React from 'react';
import { FolderKanban } from 'lucide-react';

export const ProjectsTab: React.FC = () => {
  return (
    <div className="text-center py-12">
      <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">Projektek hamarosan</h3>
      <p className="text-muted-foreground">A projekt menedzsment funkciók fejlesztés alatt állnak.</p>
    </div>
  );
};