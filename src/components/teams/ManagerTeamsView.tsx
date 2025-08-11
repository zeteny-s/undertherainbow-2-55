import React, { useEffect, useState } from 'react';
import { Users, MessageSquare, Plus, PanelsTopLeft, FolderKanban } from 'lucide-react';
import { TeamsList } from './TeamsList';
import { DealsKanban } from './crm/DealsKanban';
import { ProjectsBoard } from './projects/ProjectsBoard';

export const ManagerTeamsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'projects' | 'teams' | 'messages'>('pipeline');

  useEffect(() => {
    document.title = activeTab === 'pipeline'
      ? 'CRM Pipeline – Kezelés'
      : activeTab === 'projects'
      ? 'Projektek – Kezelés'
      : activeTab === 'teams'
      ? 'Csapatok – Kezelés'
      : 'Üzenetek – Kezelés';
  }, [activeTab]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Vezetői CRM és Projektek</h1>
          <p className="text-muted-foreground">Pipeline, projektek, csapatok és üzenetek</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="flex flex-wrap gap-2 md:space-x-6">
            {[
              { id: 'pipeline', label: 'Pipeline', icon: PanelsTopLeft },
              { id: 'projects', label: 'Projektek', icon: FolderKanban },
              { id: 'teams', label: 'Csapatok', icon: Users },
              { id: 'messages', label: 'Üzenetek', icon: MessageSquare }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-3 px-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                aria-current={activeTab === id ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'pipeline' && <DealsKanban />}
          {activeTab === 'projects' && <ProjectsBoard />}
          {activeTab === 'teams' && <TeamsList />}

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