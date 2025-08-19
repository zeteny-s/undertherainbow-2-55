import React from 'react';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';

export const CombinedAnalyticsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Kombinált Analitika</h2>
        </div>
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Összes ügyfél</p>
                <p className="text-2xl font-bold text-foreground">45</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% ez hónapban
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktív projektek</p>
                <p className="text-2xl font-bold text-foreground">8</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +3 új projekt
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bevétel (havi)</p>
                <p className="text-2xl font-bold text-foreground">2.4M Ft</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +18% előző hónaphoz képest
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Átlagos projekt érték</p>
                <p className="text-2xl font-bold text-foreground">300k Ft</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Stabilizálódott
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* CRM Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-background border border-border rounded-lg p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">CRM Teljesítmény</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lead konverzió</span>
                <span className="text-sm font-medium text-foreground">65%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ügyfél megtartás</span>
                <span className="text-sm font-medium text-foreground">89%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '89%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Átlagos deal méret</span>
                <span className="text-sm font-medium text-foreground">450k Ft</span>
              </div>
            </div>
          </div>
          
          <div className="bg-background border border-border rounded-lg p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Projekt Teljesítmény</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Időben leadott</span>
                <span className="text-sm font-medium text-foreground">78%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Költségvetés betartás</span>
                <span className="text-sm font-medium text-foreground">82%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Csapat kihasználtság</span>
                <span className="text-sm font-medium text-foreground">91%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '91%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-background border border-border rounded-lg p-4">
          <h3 className="text-lg font-medium text-foreground mb-4">Legutóbbi tevékenységek</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Új ügyfél hozzáadva: Tech Solutions Kft.</p>
                <p className="text-xs text-muted-foreground">2 órája</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">CRM</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Projekt befejezve: E-commerce platform</p>
                <p className="text-xs text-muted-foreground">5 órája</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Projekt</span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Lead státusz frissítve: Weboldal fejlesztés</p>
                <p className="text-xs text-muted-foreground">1 napja</p>
              </div>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">CRM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};