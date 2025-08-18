import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp } from 'lucide-react';

import { Deal } from '../../../types/crm';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const DealsTab: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      // Mock data for now until database is set up
      setDeals([]);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting': return 'bg-blue-100 text-blue-800';
      case 'qualification': return 'bg-yellow-100 text-yellow-800';
      case 'proposal': return 'bg-orange-100 text-orange-800';
      case 'negotiation': return 'bg-purple-100 text-purple-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'prospecting': return 'Feltárás';
      case 'qualification': return 'Kvalifikáció';
      case 'proposal': return 'Ajánlattétel';
      case 'negotiation': return 'Tárgyalás';
      case 'closed_won': return 'Megnyert';
      case 'closed_lost': return 'Elvesztett';
      default: return stage;
    }
  };

  const filteredDeals = deals.filter(deal =>
    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (deal.customer?.name && deal.customer.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
              placeholder="Üzletek keresése..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Új üzlet
        </button>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDeals.map((deal) => (
          <div key={deal.id} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{deal.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                    {getStageLabel(deal.stage)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Ügyfél: {deal.customer?.name}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-2xl font-bold text-foreground">
                    {deal.amount.toLocaleString()} Ft
                  </span>
                  <span className="text-muted-foreground">
                    {deal.probability}% esély
                  </span>
                </div>
              </div>
            </div>
            {deal.expected_close_date && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Várható lezárás: {new Date(deal.expected_close_date).toLocaleDateString('hu-HU')}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors">
                Megtekintés
              </button>
              <button className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                Szerkesztés
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDeals.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nincsenek üzletek</h3>
          <p className="text-muted-foreground mb-4">Kezdj el új üzleteket hozzáadni az értékesítési folyamathoz.</p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Első üzlet hozzáadása
          </button>
        </div>
      )}
    </div>
  );
};