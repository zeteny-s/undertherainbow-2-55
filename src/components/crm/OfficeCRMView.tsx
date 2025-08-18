import React, { useEffect, useState } from 'react';
import { Users, Target, CheckSquare } from 'lucide-react';
import { MyCustomersTab } from './tabs/MyCustomersTab';
import { MyLeadsTab } from './tabs/MyLeadsTab';
import { MyTasksTab } from './tabs/MyTasksTab';

export const OfficeCRMView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'leads' | 'tasks'>('tasks');

  useEffect(() => {
    document.title = activeTab === 'customers'
      ? 'Ügyféleim – CRM'
      : activeTab === 'leads'
      ? 'Leadeim – CRM'
      : 'Feladataim – CRM';
  }, [activeTab]);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">CRM Munkatér</h1>
          <p className="text-muted-foreground">Ügyféleim, leadeim és feladataim</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'tasks', label: 'Feladataim', icon: CheckSquare },
              { id: 'customers', label: 'Ügyféleim', icon: Users },
              { id: 'leads', label: 'Leadeim', icon: Target }
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
          {activeTab === 'tasks' && <MyTasksTab />}
          {activeTab === 'customers' && <MyCustomersTab />}
          {activeTab === 'leads' && <MyLeadsTab />}
        </div>
      </div>
    </div>
  );
};