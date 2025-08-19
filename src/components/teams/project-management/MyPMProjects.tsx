import React from 'react';
import { FolderKanban, Users, Calendar, TrendingUp } from 'lucide-react';
import { PMProject } from '../../../types/project-management';

export const MyPMProjects: React.FC = () => {
  // Mock data for user's projects
  const myProjects: PMProject[] = [
    {
      id: '1',
      user_id: 'currentUser',
      name: 'Új weboldal fejlesztés',
      description: 'Vállalati weboldal készítése React és TypeScript technológiákkal',
      status: 'active',
      priority: 'high',
      start_date: '2024-01-15',
      end_date: '2024-03-15',
      budget: 800000,
      team_members: ['user1', 'user2', 'currentUser'],
      created_by: 'manager1',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'currentUser',
      name: 'E-commerce platform',
      description: 'Online áruház fejlesztése komplett fizetési rendszerrel',
      status: 'planning',
      priority: 'medium',
      start_date: '2024-02-01',
      end_date: '2024-05-01',
      budget: 1200000,
      team_members: ['user3', 'currentUser'],
      created_by: 'manager1',
      created_at: '2024-01-20T14:00:00Z',
      updated_at: new Date().toISOString()
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return 'Tervezés';
      case 'active': return 'Aktív';
      case 'on_hold': return 'Felfüggesztve';
      case 'completed': return 'Befejezett';
      case 'cancelled': return 'Törölve';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Alacsony';
      case 'medium': return 'Közepes';
      case 'high': return 'Magas';
      case 'urgent': return 'Sürgős';
      default: return priority;
    }
  };

  const calculateProgress = (project: PMProject) => {
    // Mock progress calculation
    if (project.status === 'completed') return 100;
    if (project.status === 'active') return Math.floor(Math.random() * 70) + 20;
    if (project.status === 'planning') return Math.floor(Math.random() * 20);
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <FolderKanban className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Projektjeim</h2>
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Összes projekt</p>
                <p className="text-2xl font-bold text-foreground">{myProjects.length}</p>
              </div>
              <FolderKanban className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktív</p>
                <p className="text-2xl font-bold text-foreground">
                  {myProjects.filter(project => project.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Összes költségvetés</p>
                <p className="text-2xl font-bold text-foreground">
                  {myProjects.reduce((sum, project) => sum + project.budget, 0).toLocaleString('hu-HU')} Ft
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Csapattagok</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(myProjects.flatMap(project => project.team_members)).size}
                </p>
              </div>
              <Users className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Project List */}
        <div className="space-y-6">
          {myProjects.length > 0 ? (
            myProjects.map((project) => {
              const progress = calculateProgress(project);
              return (
                <div key={project.id} className="border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-foreground">{project.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                          {getStatusText(project.status)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(project.priority)}`}>
                          {getPriorityText(project.priority)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Előrehaladás</span>
                          <span className="text-sm font-medium text-foreground">{progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {project.start_date && project.end_date 
                              ? `${new Date(project.start_date).toLocaleDateString('hu-HU')} - ${new Date(project.end_date).toLocaleDateString('hu-HU')}`
                              : 'Időtartam nincs megadva'
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{project.team_members.length} csapattag</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>Költségvetés: {project.budget.toLocaleString('hu-HU')} Ft</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        Megnyitás
                      </button>
                      <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors">
                        Szerkesztés
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nincs hozzárendelt projekted.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};