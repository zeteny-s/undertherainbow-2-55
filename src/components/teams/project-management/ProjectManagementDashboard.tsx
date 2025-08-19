import React, { useState } from 'react';
import { FolderKanban, Users, Calendar, CheckSquare, Plus, Eye, Edit } from 'lucide-react';
import { PMProject, PMTask } from '../../../types/project-management';

export const ProjectManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'boards' | 'tasks'>('projects');

  // Mock data for now
  const mockProjects: PMProject[] = [
    {
      id: '1',
      user_id: 'user1',
      name: 'Új weboldal fejlesztés',
      description: 'Vállalati weboldal készítése React-ban',
      status: 'active',
      priority: 'high',
      budget: 800000,
      team_members: ['user1', 'user2'],
      created_by: 'user1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const mockTasks: PMTask[] = [
    {
      id: '1',
      project_id: '1',
      board_id: '1',
      title: 'Wireframe készítés',
      description: 'Alapvető wireframe-ek készítése',
      status: 'in_progress',
      priority: 'high',
      assigned_by: 'user1',
      position: 0,
      labels: ['design', 'urgent'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  return (
    <div className="space-y-6">
      {/* PM Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aktív projektek</p>
              <p className="text-2xl font-bold text-foreground">{mockProjects.length}</p>
            </div>
            <FolderKanban className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Összes feladat</p>
              <p className="text-2xl font-bold text-foreground">{mockTasks.length}</p>
            </div>
            <CheckSquare className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Csapattagok</p>
              <p className="text-2xl font-bold text-foreground">5</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Határidők</p>
              <p className="text-2xl font-bold text-foreground">3</p>
            </div>
            <Calendar className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* PM Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'projects', label: 'Projektek', icon: FolderKanban },
            { id: 'boards', label: 'Kanban táblák', icon: CheckSquare },
            { id: 'tasks', label: 'Feladatok', icon: CheckSquare }
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

      {/* PM Content */}
      {activeTab === 'projects' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Projektek</h2>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Új projekt
            </button>
          </div>
          
          <div className="space-y-4">
            {mockProjects.map((project) => (
              <div key={project.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'active' ? 'Aktív' : project.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {project.priority === 'high' ? 'Magas' : project.priority}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Költségvetés: {project.budget.toLocaleString('hu-HU')} Ft
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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

      {activeTab === 'boards' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Kanban táblák</h2>
          </div>
          <p className="text-muted-foreground">Kanban táblák hamarosan elérhetők.</p>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Összes feladat</h2>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Új feladat
            </button>
          </div>
          
          <div className="space-y-4">
            {mockTasks.map((task) => (
              <div key={task.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {task.labels.map((label) => (
                        <span key={label} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status === 'in_progress' ? 'Folyamatban' : task.status}
                    </span>
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