import React, { useEffect, useState } from 'react';
import { CheckSquare, MessageSquare, FolderKanban, Building2 } from 'lucide-react';
import { MyPMTasks } from './project-management/MyPMTasks';
import { MyPMProjects } from './project-management/MyPMProjects';
import { MyCRMTasks } from './crm/MyCRMTasks';

export const OfficeTeamsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'crm' | 'messages'>('tasks');

  useEffect(() => {
    document.title = activeTab === 'tasks'
      ? 'Projekt Feladataim – Munkatér'
      : activeTab === 'projects'
      ? 'Projektjeim – Munkatér'
      : activeTab === 'crm'
      ? 'CRM Feladataim – Munkatér'
      : 'Üzeneteim – Munkatér';
  }, [activeTab]);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Munkatér</h1>
          <p className="text-muted-foreground">Projekt feladatok, CRM tevékenységek és üzenetek</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'tasks', label: 'Projekt Feladatok', icon: CheckSquare },
              { id: 'projects', label: 'Projektjeim', icon: FolderKanban },
              { id: 'crm', label: 'CRM Feladatok', icon: Building2 },
              { id: 'messages', label: 'Üzeneteim', icon: MessageSquare }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
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
          {activeTab === 'tasks' && <MyPMTasks />}

          {activeTab === 'projects' && <MyPMProjects />}

          {activeTab === 'crm' && <MyCRMTasks />}

          {activeTab === 'messages' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Üzeneteim</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Beszélgetések
                </div>
              </div>
              <p className="text-muted-foreground">Üzenetek hamarosan elérhetők.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};