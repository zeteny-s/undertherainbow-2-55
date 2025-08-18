import React, { useState, useEffect } from 'react';
import { FolderKanban, Users, BarChart3 } from 'lucide-react';
import { ProjectsTab } from './tabs/ProjectsTab';
import { TeamsTab } from './tabs/TeamsTab';
import { PMAnalyticsTab } from './tabs/PMAnalyticsTab';

export const ManagerProjectView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'teams' | 'analytics'>('projects');

  useEffect(() => {
    document.title =
      activeTab === 'projects'
        ? 'Projektek – Projekt Menedzsment'
        : activeTab === 'teams'
        ? 'Csapatok – Projekt Menedzsment'
        : 'Analitika – Projekt Menedzsment';
  }, [activeTab]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Projekt Menedzsment</h1>
          <p className="text-muted-foreground">Projektek, csapatok és teljesítmény kezelése</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="flex flex-wrap gap-2 md:space-x-6">
            {[
              { id: 'projects', label: 'Projektek', icon: FolderKanban },
              { id: 'teams', label: 'Csapatok', icon: Users },
              { id: 'analytics', label: 'Analitika', icon: BarChart3 }
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
          {activeTab === 'projects' && <ProjectsTab />}
          {activeTab === 'teams' && <TeamsTab />}
          {activeTab === 'analytics' && <PMAnalyticsTab />}
        </div>
      </div>
    </div>
  );
};