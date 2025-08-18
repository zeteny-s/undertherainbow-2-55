import React from 'react';
import { MessageSquare } from 'lucide-react';

export const MessagesTab: React.FC = () => {
  return (
    <div className="text-center py-12">
      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">Üzenetek hamarosan</h3>
      <p className="text-muted-foreground">Az üzenetküldő funkciók fejlesztés alatt állnak.</p>
    </div>
  );
};