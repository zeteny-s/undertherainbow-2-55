import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus } from 'lucide-react';

import { Customer } from '../../../types/crm';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const CustomersTab: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Mock data for now until database is set up
      setCustomers([]);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase()))
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
              placeholder="Ügyfelek keresése..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
            <Filter className="h-4 w-4" />
            Szűrés
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <UserPlus className="h-4 w-4" />
            Új ügyfél
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{customer.name}</h3>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
                {customer.company && (
                  <p className="text-sm text-muted-foreground">{customer.company}</p>
                )}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                customer.status === 'active' ? 'bg-green-100 text-green-800' :
                customer.status === 'prospect' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {customer.status === 'active' ? 'Aktív' : 
                 customer.status === 'prospect' ? 'Potenciális' : 'Inaktív'}
              </div>
            </div>
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

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nincsenek ügyfelek</h3>
          <p className="text-muted-foreground mb-4">Kezdj el új ügyfeleket hozzáadni a CRM rendszerhez.</p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Első ügyfél hozzáadása
          </button>
        </div>
      )}
    </div>
  );
};