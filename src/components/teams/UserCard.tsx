import React from 'react';
import { User } from 'lucide-react';
import { Profile } from '../../types/teams';

interface UserCardProps {
  user: Profile;
  onDragStart: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onDragStart }) => {
  const getUserInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getProfileTypeLabel = (type: string | null) => {
    switch (type) {
      case 'vezetoi': return 'Vezető';
      case 'irodai': return 'Irodai';
      default: return type || 'Ismeretlen';
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-move transition-colors"
    >
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
        {user.name || user.email ? getUserInitials(user.name, user.email) : <User className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.name || user.email || 'Névtelen felhasználó'}
        </p>
        <p className="text-xs text-gray-500">
          {getProfileTypeLabel(user.profile_type)}
        </p>
      </div>
    </div>
  );
};