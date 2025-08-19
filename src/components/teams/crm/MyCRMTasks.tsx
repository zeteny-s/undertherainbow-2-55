import React from 'react';
import { Building2, Phone, Mail, Calendar, User, Target, TrendingUp } from 'lucide-react';
import { CRMLead } from '../../../types/crm';

export const MyCRMTasks: React.FC = () => {
  // Mock data for user's CRM tasks/leads
  const myLeads: CRMLead[] = [
    {
      id: '1',
      user_id: 'currentUser',
      title: 'Weboldal fejlesztés - Tech Solutions',
      description: 'Új céges weboldal készítése modern technológiákkal',
      status: 'contacted',
      value: 500000,
      probability: 65,
      expected_close_date: '2024-02-20',
      assigned_to: 'currentUser',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'currentUser',
      title: 'E-commerce platform - StartupXY',
      description: 'Online áruház fejlesztése fizetési rendszerrel',
      status: 'qualified',
      value: 850000,
      probability: 80,
      expected_close_date: '2024-02-25',
      assigned_to: 'currentUser',
      created_at: '2024-01-20T14:00:00Z',
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      user_id: 'currentUser',
      title: 'Mobile app - LocalBusiness',
      description: 'Üzleti mobilalkalmazás Android és iOS platformra',
      status: 'new',
      value: 750000,
      probability: 40,
      expected_close_date: '2024-03-01',
      assigned_to: 'currentUser',
      created_at: '2024-01-25T09:00:00Z',
      updated_at: new Date().toISOString()
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'won': return 'bg-emerald-100 text-emerald-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Új';
      case 'contacted': return 'Kapcsolatfelvétel';
      case 'qualified': return 'Kvalifikált';
      case 'proposal': return 'Ajánlat';
      case 'won': return 'Nyert';
      case 'lost': return 'Elvesztett';
      default: return status;
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'new': return 'Kapcsolatfelvétel';
      case 'contacted': return 'Követés';
      case 'qualified': return 'Ajánlat készítés';
      case 'proposal': return 'Ajánlat követés';
      default: return 'Frissítés';
    }
  };

  const getPriorityLevel = (probability: number, expectedDate: string) => {
    const daysUntilClose = Math.ceil((new Date(expectedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (probability >= 70 && daysUntilClose <= 7) return { level: 'urgent', color: 'bg-red-100 text-red-800', text: 'Sürgős' };
    if (probability >= 60 && daysUntilClose <= 14) return { level: 'high', color: 'bg-orange-100 text-orange-800', text: 'Magas' };
    if (probability >= 40) return { level: 'medium', color: 'bg-yellow-100 text-yellow-800', text: 'Közepes' };
    return { level: 'low', color: 'bg-green-100 text-green-800', text: 'Alacsony' };
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">CRM Feladataim</h2>
        </div>

        {/* CRM Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktív lead-ek</p>
                <p className="text-2xl font-bold text-foreground">{myLeads.length}</p>
              </div>
              <Target className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Várható bevétel</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(myLeads.reduce((sum, lead) => sum + (lead.value * lead.probability / 100), 0)).toLocaleString('hu-HU')} Ft
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Átlag valószínűség</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(myLeads.reduce((sum, lead) => sum + lead.probability, 0) / myLeads.length)}%
                </p>
              </div>
              <Target className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ez hét zárul</p>
                <p className="text-2xl font-bold text-foreground">
                  {myLeads.filter(lead => {
                    if (!lead.expected_close_date) return false;
                    const closeDate = new Date(lead.expected_close_date);
                    const weekFromNow = new Date();
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return closeDate <= weekFromNow;
                  }).length}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Lead List */}
        <div className="space-y-4">
          {myLeads.length > 0 ? (
            myLeads.map((lead) => {
              const priority = getPriorityLevel(lead.probability, lead.expected_close_date || '2024-12-31');
              return (
                <div key={lead.id} className="border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-lg font-medium text-foreground">{lead.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead.status)}`}>
                          {getStatusText(lead.status)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${priority.color}`}>
                          {priority.text}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">{lead.description}</p>
                      
                      {/* Lead Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-background border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Érték</span>
                            <span className="text-sm font-medium text-foreground">
                              {lead.value.toLocaleString('hu-HU')} Ft
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-background border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Valószínűség</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${lead.probability}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-foreground">{lead.probability}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-background border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Várható zárás</span>
                            <span className="text-sm font-medium text-foreground">
                              {lead.expected_close_date 
                                ? new Date(lead.expected_close_date).toLocaleDateString('hu-HU')
                                : 'Nincs megadva'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Létrehozva: {new Date(lead.created_at).toLocaleDateString('hu-HU')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Hozzárendelve hozzám</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-6">
                      <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        {getNextAction(lead.status)}
                      </button>
                      <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Hívás
                      </button>
                      <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nincs hozzárendelt CRM feladatod.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};