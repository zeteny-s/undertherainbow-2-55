import React, { useState, useEffect } from 'react';
import { CheckSquare, FolderKanban, MessageSquare } from 'lucide-react';
import { MyProjectTasksTab } from './tabs/MyProjectTasksTab';
import { MyProjectsTab } from './tabs/MyProjectsTab';
import { MessagesTab } from './tabs/MessagesTab';

export const OfficeProjectView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'messages'>('tasks');

  useEffect(() => {
    document.title = activeTab === 'tasks'
      ? 'Feladataim – Projekt Munkatér'
      : activeTab === 'projects'
      ? 'Projektjeim – Projekt Munkatér'
      : 'Üzeneteim – Projekt Munkatér';
  }, [activeTab]);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Projekt Munkatér</h1>
          <p className="text-muted-foreground">Feladatok, projektek és együttműködés</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'tasks', label: 'Feladataim', icon: CheckSquare },
              { id: 'projects', label: 'Projektjeim', icon: FolderKanban },
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
          {activeTab === 'tasks' && <MyProjectTasksTab />}
          {activeTab === 'projects' && <MyProjectsTab />}
          {activeTab === 'messages' && <MessagesTab />}
        </div>
      </div>
    </div>
  );
};