import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ManagerProjectView } from './ManagerProjectView';
import { OfficeProjectView } from './OfficeProjectView';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const ProjectManagementPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Get user profile type from user metadata or default to office
  const profileType = user?.user_metadata?.profile_type || 'irodai';
  const isManager = profileType === 'vezetoi';

  return (
    <div className="min-h-screen bg-background">
      {isManager ? <ManagerProjectView /> : <OfficeProjectView />}
    </div>
  );
};