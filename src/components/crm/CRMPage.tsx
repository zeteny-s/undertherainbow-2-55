import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ManagerCRMView } from './ManagerCRMView';
import { OfficeCRMView } from './OfficeCRMView';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const CRMPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Get user profile type from user metadata or default to office
  const profileType = user?.user_metadata?.profile_type || 'irodai';
  const isManager = profileType === 'vezetoi';

  return (
    <div className="min-h-screen bg-background">
      {isManager ? <ManagerCRMView /> : <OfficeCRMView />}
    </div>
  );
};