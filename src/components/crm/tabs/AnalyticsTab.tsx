import React from 'react';
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react';
import { StatCard } from '../../common/StatCard';

export const AnalyticsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Összes ügyfél"
          value="24"
          change={{ value: "+12%", isPositive: true }}
          icon={Users}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Aktív leadek"
          value="18"
          change={{ value: "+8%", isPositive: true }}
          icon={Target}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Ez havi bevétel"
          value="2.4M Ft"
          change={{ value: "+23%", isPositive: true }}
          icon={DollarSign}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatCard
          title="Konverziós ráta"
          value="68%"
          change={{ value: "+5%", isPositive: true }}
          icon={TrendingUp}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Pipeline */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Értékesítési csővezeték</h3>
          <div className="space-y-4">
            {[
              { stage: 'Feltárás', count: 8, amount: '1.2M Ft' },
              { stage: 'Kvalifikáció', count: 5, amount: '800K Ft' },
              { stage: 'Ajánlattétel', count: 3, amount: '600K Ft' },
              { stage: 'Tárgyalás', count: 2, amount: '400K Ft' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded">
                <div>
                  <p className="font-medium text-foreground">{item.stage}</p>
                  <p className="text-sm text-muted-foreground">{item.count} üzlet</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{item.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Legutóbbi tevékenységek</h3>
          <div className="space-y-4">
            {[
              { action: 'Új ügyfél hozzáadva', client: 'ABC Kft.', time: '2 órája' },
              { action: 'Lead kvalifikálva', client: 'XYZ Zrt.', time: '4 órája' },
              { action: 'Üzlet lezárva', client: 'DEF Bt.', time: '1 napja' },
              { action: 'Ajánlat elküldve', client: 'GHI Kft.', time: '2 napja' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded">
                <div>
                  <p className="font-medium text-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.client}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Teljesítmény mutatók</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">68%</div>
            <div className="text-sm text-muted-foreground">Lead konverzió</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">14 nap</div>
            <div className="text-sm text-muted-foreground">Átlagos értékesítési ciklus</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">320K Ft</div>
            <div className="text-sm text-muted-foreground">Átlagos üzlet érték</div>
          </div>
        </div>
      </div>
    </div>
  );
};