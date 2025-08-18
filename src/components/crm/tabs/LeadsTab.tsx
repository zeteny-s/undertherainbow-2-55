import React, { useState, useEffect } from 'react';
import { Plus, Search, Target } from 'lucide-react';

import { Lead } from '../../../types/crm';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const LeadsTab: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Mock data for now until database is set up
      setLeads([]);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'proposal': return 'bg-yellow-100 text-yellow-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Új';
      case 'qualified': return 'Kvalifikált';
      case 'proposal': return 'Ajánlat';
      case 'negotiation': return 'Tárgyalás';
      case 'closed_won': return 'Megnyert';
      case 'closed_lost': return 'Elvesztett';
      default: return status;
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.customer?.name && lead.customer.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Leadek keresése..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Új lead
        </button>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {filteredLeads.map((lead) => (
          <div key={lead.id} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{lead.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {getStatusLabel(lead.status)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{lead.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Ügyfél: {lead.customer?.name}</span>
                  <span>Valószínűség: {lead.probability}%</span>
                  {lead.value && <span>Érték: {lead.value.toLocaleString()} Ft</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors">
                Megtekintés
              </button>
              <button className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                Szerkesztés
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nincsenek leadek</h3>
          <p className="text-muted-foreground mb-4">Kezdj el új leadeket hozzáadni az értékesítési folyamathoz.</p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Első lead hozzáadása
          </button>
        </div>
      )}
    </div>
  );
};