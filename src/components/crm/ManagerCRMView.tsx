import React, { useEffect, useState } from 'react';
import { Users, Target, TrendingUp, Activity } from 'lucide-react';
import { CustomersTab } from './tabs/CustomersTab';
import { LeadsTab } from './tabs/LeadsTab';
import { DealsTab } from './tabs/DealsTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';

export const ManagerCRMView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'leads' | 'deals' | 'analytics'>('customers');

  useEffect(() => {
    document.title =
      activeTab === 'customers'
        ? 'Ügyfelek – CRM'
        : activeTab === 'leads'
        ? 'Leadek – CRM'
        : activeTab === 'deals'
        ? 'Üzletek – CRM'
        : 'Analitika – CRM';
  }, [activeTab]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">CRM Rendszer</h1>
          <p className="text-muted-foreground">Ügyfélkezelés, leadek és értékesítési folyamatok</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="flex flex-wrap gap-2 md:space-x-6">
            {[
              { id: 'customers', label: 'Ügyfelek', icon: Users },
              { id: 'leads', label: 'Leadek', icon: Target },
              { id: 'deals', label: 'Üzletek', icon: TrendingUp },
              { id: 'analytics', label: 'Analitika', icon: Activity }
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
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'leads' && <LeadsTab />}
          {activeTab === 'deals' && <DealsTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </div>
  );
};