import React from 'react';
import { Users } from 'lucide-react';

export const TeamsTab: React.FC = () => {
  return (
    <div className="text-center py-12">
      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">Csapatok hamarosan</h3>
      <p className="text-muted-foreground">A csapat menedzsment funkciók fejlesztés alatt állnak.</p>
    </div>
  );
};