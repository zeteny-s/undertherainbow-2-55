import React, { useState } from 'react';
import { Building2, Target, TrendingUp, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { CRMCustomer, CRMLead, CRMDeal } from '../../../types/crm';

export const CRMDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'leads' | 'deals'>('customers');

  // Mock data for now - will be replaced with real API calls
  const mockCustomers: CRMCustomer[] = [
    {
      id: '1',
      user_id: 'user1',
      name: 'Nagy János',
      email: 'nagy.janos@email.com',
      company: 'Tech Solutions Kft.',
      phone: '+36 30 123 4567',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const mockLeads: CRMLead[] = [
    {
      id: '1',
      user_id: 'user1',
      title: 'Weboldal fejlesztés',
      description: 'Új céges weboldal készítése',
      status: 'qualified',
      value: 500000,
      probability: 75,
      expected_close_date: '2024-02-15',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const mockDeals: CRMDeal[] = [
    {
      id: '1',
      user_id: 'user1',
      customer_id: '1',
      title: 'E-commerce platform',
      amount: 1200000,
      status: 'negotiation',
      probability: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  return (
    <div className="space-y-6">
      {/* CRM Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ügyfelek</p>
              <p className="text-2xl font-bold text-foreground">{mockCustomers.length}</p>
            </div>
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aktív Lead-ek</p>
              <p className="text-2xl font-bold text-foreground">{mockLeads.length}</p>
            </div>
            <Target className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Üzletek</p>
              <p className="text-2xl font-bold text-foreground">{mockDeals.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Várható bevétel</p>
              <p className="text-2xl font-bold text-foreground">
                {mockDeals.reduce((sum, deal) => sum + deal.amount, 0).toLocaleString('hu-HU')} Ft
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* CRM Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'customers', label: 'Ügyfelek', icon: Building2 },
            { id: 'leads', label: 'Lead-ek', icon: Target },
            { id: 'deals', label: 'Üzletek', icon: TrendingUp }
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

      {/* CRM Content */}
      {activeTab === 'customers' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Ügyfelek</h2>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Új ügyfél
            </button>
          </div>
          
          <div className="space-y-4">
            {mockCustomers.map((customer) => (
              <div key={customer.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">{customer.company}</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.status === 'active' ? 'Aktív' : 'Inaktív'}
                    </span>
                    <button className="p-2 hover:bg-accent rounded-md">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-accent rounded-md">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-accent rounded-md text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Lead-ek</h2>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Új lead
            </button>
          </div>
          
          <div className="space-y-4">
            {mockLeads.map((lead) => (
              <div key={lead.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{lead.title}</h3>
                    <p className="text-sm text-muted-foreground">{lead.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Érték: {lead.value.toLocaleString('hu-HU')} Ft • 
                      Esély: {lead.probability}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      lead.status === 'qualified' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status === 'qualified' ? 'Kvalifikált' : lead.status}
                    </span>
                    <button className="p-2 hover:bg-accent rounded-md">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-accent rounded-md">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'deals' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Üzletek</h2>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Új üzlet
            </button>
          </div>
          
          <div className="space-y-4">
            {mockDeals.map((deal) => (
              <div key={deal.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{deal.title}</h3>
                    <p className="text-sm text-muted-foreground">{deal.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Összeg: {deal.amount.toLocaleString('hu-HU')} Ft • 
                      Esély: {deal.probability}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      deal.status === 'negotiation' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {deal.status === 'negotiation' ? 'Tárgyalás' : deal.status}
                    </span>
                    <button className="p-2 hover:bg-accent rounded-md">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-accent rounded-md">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};