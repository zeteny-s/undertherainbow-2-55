import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ManagerTeamsView } from './ManagerTeamsView';
import { OfficeTeamsView } from './OfficeTeamsView';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { TeamsDashboard } from './TeamsDashboard';

export const TeamsPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Get user profile type from user metadata or default to office
  const profileType = user?.user_metadata?.profile_type || 'irodai';
  const isManager = profileType === 'vezetoi';

  return (
    <div className="min-h-screen bg-background">
      {isManager ? <TeamsDashboard /> : <OfficeTeamsView />}
    </div>
  );
};