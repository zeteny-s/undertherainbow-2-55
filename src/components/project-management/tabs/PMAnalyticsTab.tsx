import React from 'react';
import { BarChart3 } from 'lucide-react';

export const PMAnalyticsTab: React.FC = () => {
  return (
    <div className="text-center py-12">
      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">Analitika hamarosan</h3>
      <p className="text-muted-foreground">A projekt analitika funkciók fejlesztés alatt állnak.</p>
    </div>
  );
};