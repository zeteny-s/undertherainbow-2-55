import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ManagerTeamsView } from './ManagerTeamsView';
import { OfficeTeamsView } from './OfficeTeamsView';

export const TeamsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);

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
      
      setIsManager(profile?.profile_type === 'vezetoi');
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return isManager ? <ManagerTeamsView /> : <OfficeTeamsView />;
};