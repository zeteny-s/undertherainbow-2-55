import React from 'react';
import { CheckSquare, Clock, User, AlertCircle } from 'lucide-react';
import { PMTask } from '../../../types/project-management';

export const MyPMTasks: React.FC = () => {
  // Mock data for user's tasks
  const myTasks: PMTask[] = [
    {
      id: '1',
      project_id: '1',
      board_id: '1',
      title: 'Wireframe készítés',
      description: 'Alapvető wireframe-ek készítése az új weboldalhoz',
      status: 'in_progress',
      priority: 'high',
      assigned_by: 'manager1',
      assigned_to: 'currentUser',
      due_date: '2024-02-15T10:00:00Z',
      position: 0,
      labels: ['design', 'urgent'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      project_id: '2',
      board_id: '2',
      title: 'API dokumentáció',
      description: 'REST API dokumentáció elkészítése',
      status: 'todo',
      priority: 'medium',
      assigned_by: 'manager1',
      assigned_to: 'currentUser',
      due_date: '2024-02-20T14:00:00Z',
      position: 1,
      labels: ['backend', 'documentation'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
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
      case 'todo': return 'Tennivaló';
      case 'in_progress': return 'Folyamatban';
      case 'review': return 'Ellenőrzés';
      case 'done': return 'Kész';
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

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <CheckSquare className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Projekt Feladataim</h2>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Összes</p>
                <p className="text-2xl font-bold text-foreground">{myTasks.length}</p>
              </div>
              <CheckSquare className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Folyamatban</p>
                <p className="text-2xl font-bold text-foreground">
                  {myTasks.filter(task => task.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sürgős</p>
                <p className="text-2xl font-bold text-foreground">
                  {myTasks.filter(task => task.priority === 'urgent' || task.priority === 'high').length}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
          </div>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kész</p>
                <p className="text-2xl font-bold text-foreground">
                  {myTasks.filter(task => task.status === 'done').length}
                </p>
              </div>
              <CheckSquare className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {myTasks.length > 0 ? (
            myTasks.map((task) => (
              <div key={task.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-foreground">{task.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {getStatusText(task.status)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                        {getPriorityText(task.priority)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Határidő: {new Date(task.due_date).toLocaleDateString('hu-HU')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Projekt #{task.project_id}</span>
                      </div>
                    </div>
                    
                    {task.labels.length > 0 && (
                      <div className="flex gap-1 mt-3">
                        {task.labels.map((label) => (
                          <span key={label} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      Szerkesztés
                    </button>
                    {task.status !== 'done' && (
                      <button className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                        Befejezés
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nincs hozzárendelt feladatod.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};