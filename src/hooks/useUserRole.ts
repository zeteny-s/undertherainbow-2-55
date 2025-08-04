import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface UserRole {
  isManager: boolean;
  isOffice: boolean;
  profileType: 'vezetoi' | 'irodai' | null;
  loading: boolean;
}

export const useUserRole = (): UserRole => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>({
    isManager: false,
    isOffice: false,
    profileType: null,
    loading: true,
  });

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setRole({
          isManager: false,
          isOffice: false,
          profileType: null,
          loading: false,
        });
        return;
      }

      try {
        // First, try to get from database (authoritative source)
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('profile_type')
          .eq('id', user.id)
          .single();

        let profileType: 'vezetoi' | 'irodai' | null = null;

        if (!error && profile?.profile_type) {
          // Use database value as primary source
          profileType = profile.profile_type as 'vezetoi' | 'irodai';
        } else {
          // Fallback to user metadata if database query fails
          profileType = user.user_metadata?.profile_type as 'vezetoi' | 'irodai' || 'irodai';
          
          // If we had to use fallback, sync the database
          if (profileType) {
            await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                profile_type: profileType,
                name: user.user_metadata?.name || '',
                email: user.email || '',
                updated_at: new Date().toISOString(),
              });
          }
        }

        setRole({
          isManager: profileType === 'vezetoi',
          isOffice: profileType === 'irodai',
          profileType,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking user role:', error);
        // Fallback to user metadata if database is unavailable
        const metadataProfileType = user.user_metadata?.profile_type as 'vezetoi' | 'irodai' || 'irodai';
        setRole({
          isManager: metadataProfileType === 'vezetoi',
          isOffice: metadataProfileType === 'irodai',
          profileType: metadataProfileType,
          loading: false,
        });
      }
    };

    checkUserRole();
  }, [user]);

  return role;
};