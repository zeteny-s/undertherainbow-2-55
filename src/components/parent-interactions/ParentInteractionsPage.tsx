import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { FamilyHeader } from './FamilyHeader';
import { InteractionTimeline } from './InteractionTimeline';
import { InteractionForm } from './InteractionForm';
import { Users, AlertCircle } from 'lucide-react';
import type { 
  Family, 
  HouseLeader, 
  ParentInteraction, 
  InteractionType,
  AnnualProgress,
  InteractionForm as InteractionFormData 
} from '../../types/parent-interactions';

export const ParentInteractionsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [houseLeader, setHouseLeader] = useState<HouseLeader | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [interactions, setInteractions] = useState<ParentInteraction[]>([]);
  const [interactionTypes, setInteractionTypes] = useState<InteractionType[]>([]);
  const [progress, setProgress] = useState<AnnualProgress | null>(null);
  const [editingInteraction, setEditingInteraction] = useState<ParentInteraction | null>(null);
  const [academicYear, setAcademicYear] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  });

  useEffect(() => {
    if (user) {
      initializeData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedFamily && houseLeader) {
      loadInteractions();
      loadProgress();
    }
  }, [selectedFamily, academicYear, houseLeader]);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) return;
      
      // Check if user is a house leader from metadata instead of database table
      const profileType = user.user_metadata?.profile_type;
      if (profileType !== 'haz_vezeto') {
        setLoading(false);
        return;
      }

      // Create a house leader object from user metadata
      const houseLeaderData: HouseLeader = {
        id: user.id,
        user_id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'House Leader',
        email: user.email || '',
        status: 'active',
        max_families: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setHouseLeader(houseLeaderData);

      // For now, we'll create mock families since the family assignment system isn't fully set up
      // This should be replaced with real database queries when the family system is implemented
      const mockFamilies: Family[] = [
        {
          id: '1',
          name: 'Smith Family',
          primary_contact_name: 'John Smith',
          primary_contact_email: 'john.smith@example.com',
          primary_contact_phone: '+36301234567',
          address: '1234 Budapest, Example Street 12.',
          children_count: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Johnson Family',
          primary_contact_name: 'Mary Johnson',
          primary_contact_email: 'mary.johnson@example.com',
          primary_contact_phone: '+36301234568',
          address: '1234 Budapest, Sample Avenue 34.',
          children_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setFamilies(mockFamilies);
      
      if (mockFamilies.length > 0) {
        setSelectedFamily(mockFamilies[0]);
      }

      const { data: typesData } = await supabase
        .from('interaction_types')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true });

      setInteractionTypes(typesData as InteractionType[] || []);

    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInteractions = async () => {
    if (!selectedFamily || !houseLeader) return;

    try {
      const academicYearStart = `${academicYear.split('-')[0]}-09-01`;
      const academicYearEnd = `${academicYear.split('-')[1]}-08-31`;

      const { data } = await supabase
        .from('parent_interactions')
        .select(`*, interaction_types(*)`)
        .eq('family_id', selectedFamily.id)
        .eq('house_leader_id', houseLeader.id)
        .gte('interaction_date', academicYearStart)
        .lte('interaction_date', academicYearEnd)
        .order('interaction_date', { ascending: false });

      setInteractions((data || []).map((interaction: any) => ({
        ...interaction,
        duration_minutes: interaction.duration_minutes ?? undefined,
        action_items: interaction.action_items ?? [],
        key_topics: interaction.key_topics ?? [],
        participants: interaction.participants ?? []
      })));
    } catch (error) {
      console.error('Error loading interactions:', error);
    }
  };

  const loadProgress = async () => {
    if (!selectedFamily || !houseLeader) return;

    try {
      const { data } = await supabase
        .from('annual_progress')
        .select('*')
        .eq('family_id', selectedFamily.id)
        .eq('house_leader_id', houseLeader.id)
        .eq('academic_year', academicYear)
        .maybeSingle();

      setProgress(data ? {
        ...data,
        total_hours: data.total_hours ?? 0,
        total_interactions: data.total_interactions ?? 0,
        goal_hours: data.goal_hours ?? 0
      } : null);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleCreateInteraction = async (formData: InteractionFormData) => {
    if (!selectedFamily || !houseLeader) return;

    try {
      const interactionType = interactionTypes.find(t => t.id === formData.interaction_type_id);
      if (!interactionType) return;

      const { data, error } = await supabase
        .from('parent_interactions')
        .insert({
          house_leader_id: houseLeader.id,
          family_id: selectedFamily.id,
          interaction_type_id: formData.interaction_type_id,
          interaction_date: formData.interaction_date.toISOString(),
          duration_minutes: formData.duration_minutes,
          hour_value: interactionType.hour_value,
          title: formData.title,
          description: formData.description,
          participants: formData.participants,
          key_topics: formData.key_topics,
          action_items: formData.action_items,
          follow_up_date: formData.follow_up_date?.toISOString().split('T')[0],
          quality_rating: formData.quality_rating,
          cultural_notes: formData.cultural_notes || null,
          attachments: []
        })
        .select(`*, interaction_types(*)`)
        .single();

      if (error) throw error;

      if (data) {
        const mappedData = {
          ...data,
          duration_minutes: data.duration_minutes ?? undefined,
          action_items: data.action_items ?? [],
          key_topics: data.key_topics ?? [],
          participants: data.participants ?? []
        };
        setInteractions(prev => [mappedData, ...prev]);
        loadProgress();
      }
    } catch (error) {
      console.error('Error creating interaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading parent interactions..." />
      </div>
    );
  }

  if (!houseLeader) {
    const profileType = user?.user_metadata?.profile_type;
    return (
      <EmptyState
        icon={AlertCircle}
        title="Access Restricted"
        description={
          profileType === 'haz_vezeto' 
            ? "Loading house leader data..." 
            : "Only House Leaders can access the Parent Interaction Tracking system."
        }
      />
    );
  }

  if (families.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Families Assigned"
        description={`No families are currently assigned to you for the ${academicYear} academic year.`}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <FamilyHeader
        families={families}
        selectedFamily={selectedFamily}
        onFamilyChange={setSelectedFamily}
        progress={progress}
        academicYear={academicYear}
        onAcademicYearChange={setAcademicYear}
      />
      
      <div className="flex-1 flex min-h-0 px-6">
        <div className="w-3/5 pr-4 flex flex-col">
          <InteractionTimeline
            interactions={interactions}
            onEdit={setEditingInteraction}
            onDelete={() => {}}
          />
        </div>
        
        <div className="w-2/5 pl-4 border-l border-gray-200">
          <InteractionForm
            interactionTypes={interactionTypes}
            onSubmit={handleCreateInteraction}
            onCancel={() => setEditingInteraction(null)}
            isEditing={!!editingInteraction}
          />
        </div>
      </div>
    </div>
  );
};