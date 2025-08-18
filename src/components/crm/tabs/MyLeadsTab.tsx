import React, { useState } from 'react';
import { Search, Target } from 'lucide-react';

export const MyLeadsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Leadeim keresése..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Nincsenek hozzám rendelt leadek</h3>
        <p className="text-muted-foreground">A vezető fog hozzárendelni leadeket.</p>
      </div>
    </div>
  );
};