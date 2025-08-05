import React, { useState } from 'react';
import { Users, MessageSquare, Settings, Plus } from 'lucide-react';
import { TeamsList } from './TeamsList';

export const ManagerTeamsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'teams' | 'tasks' | 'messages'>('teams');

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Csapat Kezelés</h1>
          <p className="text-muted-foreground">Csapatok, feladatok és üzenetek kezelése</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'teams', label: 'Csapatok', icon: Users },
              { id: 'tasks', label: 'Feladatok', icon: Settings },
              { id: 'messages', label: 'Üzenetek', icon: MessageSquare }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'teams' && <TeamsList />}

          {activeTab === 'tasks' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Feladatok</h2>
                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                  <Plus className="h-4 w-4" />
                  Új Feladat
                </button>
              </div>
              <p className="text-muted-foreground">Feladatok kezelése hamarosan elérhető.</p>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Üzenetek</h2>
                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                  <Plus className="h-4 w-4" />
                  Új Üzenet
                </button>
              </div>
              <p className="text-muted-foreground">Üzenetküldés hamarosan elérhető.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};