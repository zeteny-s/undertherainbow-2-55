import React, { useEffect, useState } from 'react';
import { Users, FolderKanban, BarChart3, Building2 } from 'lucide-react';
import { TeamsList } from './TeamsList';
import { CRMDashboard } from './crm/CRMDashboard';
import { ProjectManagementDashboard } from './project-management/ProjectManagementDashboard';
import { CombinedAnalyticsDashboard } from './analytics/CombinedAnalyticsDashboard';

export const ManagerTeamsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'crm' | 'projects' | 'teams' | 'analytics'>('crm');

  useEffect(() => {
    document.title =
      activeTab === 'crm'
        ? 'CRM Ügyfélkezelés – Kezelés'
        : activeTab === 'projects'
        ? 'Projektmenedzsment – Kezelés'
        : activeTab === 'teams'
        ? 'Csapatok – Kezelés'
        : 'Analitika – Kezelés';
  }, [activeTab]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Vezetői CRM és Projektmenedzsment</h1>
          <p className="text-muted-foreground">Ügyfélkezelés, projektvezetés, csapatmunka és teljesítmény elemzés</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="flex flex-wrap gap-2 md:space-x-6">
            {[
              { id: 'crm', label: 'CRM Ügyfélkezelés', icon: Building2 },
              { id: 'projects', label: 'Projektmenedzsment', icon: FolderKanban },
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
          {activeTab === 'crm' && <CRMDashboard />}
          {activeTab === 'projects' && <ProjectManagementDashboard />}
          {activeTab === 'teams' && <TeamsList />}
          {activeTab === 'analytics' && <CombinedAnalyticsDashboard />}
        </div>
      </div>
    </div>
  );
};