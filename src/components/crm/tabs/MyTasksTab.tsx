import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const MyTasksTab: React.FC = () => {
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
              placeholder="Feladataim keresése..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Task Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { id: 'todo', title: 'Tennivalók', tasks: [] },
          { id: 'in_progress', title: 'Folyamatban', tasks: [] },
          { id: 'done', title: 'Kész', tasks: [] }
        ].map((column) => (
          <div key={column.id} className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-medium text-foreground mb-4">{column.title}</h3>
            <div className="space-y-3 min-h-[200px]">
              <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-md">
                Nincsenek feladatok
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};