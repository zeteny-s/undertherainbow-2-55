import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ManagerTeamsView } from './ManagerTeamsView';
import { OfficeTeamsView } from './OfficeTeamsView';
import { EnhancedManagerDashboard } from './EnhancedManagerDashboard';
import { EnhancedOfficeDashboard } from './EnhancedOfficeDashboard';
import { TeamReports } from './reports/TeamReports';
import { Users, BarChart3, MessageSquare, FileText } from 'lucide-react';

export const TeamsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profile_type')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      const isManagerRole = profile?.profile_type === 'vezetoi';
      setIsManager(isManagerRole);
      // Set default tab based on user role
      setActiveTab(isManagerRole ? 'dashboard' : 'overview');
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isManager) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Menedzsment Panel</h1>
                <p className="text-muted-foreground">Csapatok és teljesítmény kezelése</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <div className="space-y-6">
            <div className="flex gap-4 border-b border-border">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'teams'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                Csapatok
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'reports'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4" />
                Jelentések
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'messages'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Üzenetek
              </button>
            </div>

            {activeTab === 'dashboard' && <EnhancedManagerDashboard />}
            {activeTab === 'teams' && <ManagerTeamsView />}
            {activeTab === 'reports' && <TeamReports />}
            {activeTab === 'messages' && (
              <div className="bg-muted/20 border border-border rounded-lg p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Üzenetküldés</h3>
                <p className="text-muted-foreground">
                  Az üzenetküldő funkció hamarosan elérhető lesz.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Munkaterület</h1>
                <p className="text-muted-foreground">Csapat és feladatok áttekintése</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <div className="space-y-6">
            <div className="flex gap-4 border-b border-border">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Áttekintés
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                Feladatok
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'messages'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Üzenetek
              </button>
            </div>

            {activeTab === 'overview' && <EnhancedOfficeDashboard />}
            {activeTab === 'tasks' && <OfficeTeamsView />}
            {activeTab === 'messages' && (
              <div className="bg-muted/20 border border-border rounded-lg p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Üzenetek</h3>
                <p className="text-muted-foreground">
                  Az üzenetküldő funkció hamarosan elérhető lesz.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};