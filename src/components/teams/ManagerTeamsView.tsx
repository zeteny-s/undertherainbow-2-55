import React, { useEffect, useState } from 'react';
import { Users, FolderKanban, BarChart3 } from 'lucide-react';
import { TeamsList } from './TeamsList';
import AccountsDirectory from './AccountsDirectory';
import ProjectsPortfolio from './projects/ProjectsPortfolio';
import PerformanceDashboard from './PerformanceDashboard';

export const ManagerTeamsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'projects' | 'teams' | 'performance'>('accounts');

  useEffect(() => {
    document.title =
      activeTab === 'accounts'
        ? 'Fiókok – Kezelés'
        : activeTab === 'projects'
        ? 'Projektek – Kezelés'
        : activeTab === 'teams'
        ? 'Csapatok – Kezelés'
        : 'Teljesítmény – Kezelés';
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
              { id: 'accounts', label: 'Fiókok', icon: Users },
              { id: 'projects', label: 'Projektek', icon: FolderKanban },
              { id: 'teams', label: 'Csapatok', icon: Users },
              { id: 'performance', label: 'Teljesítmény', icon: BarChart3 }
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
          {activeTab === 'accounts' && <AccountsDirectory />}
          {activeTab === 'projects' && <ProjectsPortfolio />}
          {activeTab === 'teams' && <TeamsList />}
          {activeTab === 'performance' && <PerformanceDashboard />}
        </div>
      </div>
    </div>
  );
};