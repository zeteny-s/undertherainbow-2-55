import React from 'react';
import { Users, Calendar, Edit, Trash2, UserMinus } from 'lucide-react';
import { Team, TeamMember, Task } from '../../types/teams';

interface TeamCardProps {
  team: Team;
  members: TeamMember[];
  tasks: Task[];
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
  onRemoveUser: (teamId: string, userId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  members,
  tasks,
  onEdit,
  onDelete,
  onRemoveUser,
  onDragOver,
  onDrop
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{team.name}</h3>
          {team.description && (
            <p className="text-sm text-gray-600 mt-1">{team.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(team)}
            className="text-gray-400 hover:text-blue-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(team.id)}
            className="text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Team Members */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Tagok ({members.length})
          </span>
        </div>
        <div className="space-y-1">
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
              <div className="text-sm">
                <span className="font-medium">
                  {member.profiles?.name || 'Névtelen'}
                </span>
                <span className="text-gray-500 ml-2">
                  ({member.profiles?.profile_type})
                </span>
              </div>
              <button
                onClick={() => onRemoveUser(team.id, member.user_id)}
                className="text-gray-400 hover:text-red-600"
              >
                <UserMinus className="h-3 w-3" />
              </button>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-xs text-gray-500 italic">Nincs tag hozzárendelve</p>
          )}
        </div>
      </div>

      {/* Team Tasks */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Feladatok ({tasks.length})
          </span>
        </div>
        <div className="space-y-1">
          {tasks.slice(0, 3).map(task => (
            <div key={task.id} className="bg-gray-50 rounded px-2 py-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{task.title}</span>
                <div className="flex gap-1">
                  <span className={`text-xs px-1 rounded ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`text-xs px-1 rounded ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {tasks.length > 3 && (
            <p className="text-xs text-gray-500">+{tasks.length - 3} további feladat</p>
          )}
          {tasks.length === 0 && (
            <p className="text-xs text-gray-500 italic">Nincs feladat</p>
          )}
        </div>
      </div>
    </div>
  );
};