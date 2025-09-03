import React, { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Family, FamilyInteraction, AnnualProgress } from '../../types/family-relationships';
import { FamilyList } from './FamilyList';
import { FamilyTimeline } from './FamilyTimeline';
import { InteractionForm } from './InteractionForm';
import { FamilyForm } from './FamilyForm';
import { ProgressCard } from './ProgressCard';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const FamilyRelationshipsPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [interactions, setInteractions] = useState<FamilyInteraction[]>([]);
  const [progress, setProgress] = useState<AnnualProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [editingInteraction, setEditingInteraction] = useState<FamilyInteraction | null>(null);

  useEffect(() => {
    loadFamilies();
  }, [user]);

  useEffect(() => {
    if (selectedFamily) {
      loadInteractions(selectedFamily.id);
      loadProgress(selectedFamily.id);
    }
  }, [selectedFamily]);

  const loadFamilies = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('house_leader_id', user.id)
        .order('name');

      if (error) throw error;
      setFamilies(data || []);
      
      if (data && data.length > 0 && !selectedFamily) {
        setSelectedFamily(data[0]);
      }
    } catch (error) {
      console.error('Error loading families:', error);
      addNotification('Hiba a családok betöltésekor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadInteractions = async (familyId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('family_interactions')
        .select('*')
        .eq('family_id', familyId)
        .eq('house_leader_id', user.id)
        .order('interaction_date', { ascending: false });

      if (error) throw error;
      setInteractions(data as FamilyInteraction[] || []);
    } catch (error) {
      console.error('Error loading interactions:', error);
      addNotification('Hiba az interakciók betöltésekor', 'error');
    }
  };

  const loadProgress = async (familyId: string) => {
    if (!user) return;

    try {
      const currentYear = new Date().getFullYear();
      const academicYear = new Date().getMonth() >= 8 ? 
        `${currentYear}-${currentYear + 1}` : 
        `${currentYear - 1}-${currentYear}`;

      const { data, error } = await supabase
        .from('annual_progress')
        .select('*')
        .eq('family_id', familyId)
        .eq('house_leader_id', user.id)
        .eq('academic_year', academicYear)
        .maybeSingle();

      if (error) throw error;
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleFamilyCreate = async (familyData: Partial<Family>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('families')
        .insert([{
          name: familyData.name!,
          house_leader_id: user.id,
          child_name: familyData.child_name || null,
          child_age: familyData.child_age || null,
          start_date: familyData.start_date || null,
          notes: familyData.notes || null
        }])
        .select()
        .single();

      if (error) throw error;
      
      setFamilies(prev => [...prev, data]);
      setShowFamilyForm(false);
      addNotification('Család sikeresen hozzáadva', 'success');
    } catch (error) {
      console.error('Error creating family:', error);
      addNotification({
        title: 'Hiba',
        message: 'Hiba a család hozzáadásakor',
        type: 'error'
      });
    }
  };

  const handleFamilyUpdate = async (familyData: Partial<Family>) => {
    if (!editingFamily || !user) return;

    try {
      const { data, error } = await supabase
        .from('families')
        .update(familyData)
        .eq('id', editingFamily.id)
        .eq('house_leader_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setFamilies(prev => prev.map(f => f.id === editingFamily.id ? data : f));
      if (selectedFamily?.id === editingFamily.id) {
        setSelectedFamily(data);
      }
      setEditingFamily(null);
      addNotification({
        title: 'Siker',
        message: 'Család sikeresen frissítve',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating family:', error);
      addNotification({
        title: 'Hiba',
        message: 'Hiba a család frissítésekor',
        type: 'error'
      });
    }
  };

  const handleFamilyDelete = async (familyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId)
        .eq('house_leader_id', user.id);

      if (error) throw error;
      
      setFamilies(prev => prev.filter(f => f.id !== familyId));
      if (selectedFamily?.id === familyId) {
        const remainingFamilies = families.filter(f => f.id !== familyId);
        setSelectedFamily(remainingFamilies.length > 0 ? remainingFamilies[0] : null);
      }
      addNotification({
        title: 'Siker',
        message: 'Család sikeresen törölve',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting family:', error);
      addNotification({
        title: 'Hiba',
        message: 'Hiba a család törlésekor',
        type: 'error'
      });
    }
  };

  const handleInteractionCreate = async (interactionData: Partial<FamilyInteraction>) => {
    if (!user || !selectedFamily) return;

    try {
      const { data, error } = await supabase
        .from('family_interactions')
        .insert([{
          family_id: selectedFamily.id,
          house_leader_id: user.id,
          interaction_date: interactionData.interaction_date!,
          category: interactionData.category!,
          duration_minutes: interactionData.duration_minutes!,
          location: interactionData.location || null,
          notes: interactionData.notes || null,
          satisfaction_level: interactionData.satisfaction_level || null,
          referral_opportunity: interactionData.referral_opportunity || false,
          next_steps: interactionData.next_steps || null
        }])
        .select()
        .single();

      if (error) throw error;
      
      setInteractions(prev => [data as FamilyInteraction, ...prev]);
      setShowInteractionForm(false);
      loadProgress(selectedFamily.id); // Reload progress after adding interaction
      addNotification({
        title: 'Siker',
        message: 'Interakció sikeresen hozzáadva',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating interaction:', error);
      addNotification({
        title: 'Hiba',
        message: 'Hiba az interakció hozzáadásakor',
        type: 'error'
      });
    }
  };

  const handleInteractionUpdate = async (interactionData: Partial<FamilyInteraction>) => {
    if (!editingInteraction || !user) return;

    try {
      const { data, error } = await supabase
        .from('family_interactions')
        .update(interactionData)
        .eq('id', editingInteraction.id)
        .eq('house_leader_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setInteractions(prev => prev.map(i => i.id === editingInteraction.id ? data as FamilyInteraction : i));
      setEditingInteraction(null);
      if (selectedFamily) {
        loadProgress(selectedFamily.id); // Reload progress after updating interaction
      }
      addNotification({
        title: 'Siker',
        message: 'Interakció sikeresen frissítve',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating interaction:', error);
      addNotification({
        title: 'Hiba',
        message: 'Hiba az interakció frissítésekor',
        type: 'error'
      });
    }
  };

  const handleInteractionDelete = async (interactionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('family_interactions')
        .delete()
        .eq('id', interactionId)
        .eq('house_leader_id', user.id);

      if (error) throw error;
      
      setInteractions(prev => prev.filter(i => i.id !== interactionId));
      if (selectedFamily) {
        loadProgress(selectedFamily.id); // Reload progress after deleting interaction
      }
      addNotification({
        title: 'Siker',
        message: 'Interakció sikeresen törölve', 
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting interaction:', error);
      addNotification({
        title: 'Hiba',
        message: 'Hiba az interakció törlésekor',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Családi Kapcsolatok
            </h1>
          </div>
          <button
            onClick={() => setShowFamilyForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Új Család
          </button>
        </div>
        
        {selectedFamily && progress && (
          <ProgressCard progress={progress} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Family List */}
        <div className="lg:col-span-1">
          <FamilyList
            families={families}
            selectedFamily={selectedFamily}
            onSelectFamily={setSelectedFamily}
            onEditFamily={setEditingFamily}
            onDeleteFamily={handleFamilyDelete}
          />
        </div>

        {/* Timeline and Form */}
        <div className="lg:col-span-3">
          {selectedFamily ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Timeline */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedFamily.name} - Kapcsolattörténet
                    </h2>
                    <button
                      onClick={() => setShowInteractionForm(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Új Interakció
                    </button>
                  </div>
                  
                  <FamilyTimeline
                    interactions={interactions}
                    onEditInteraction={setEditingInteraction}
                    onDeleteInteraction={handleInteractionDelete}
                  />
                </div>
              </div>

              {/* Form Panel */}
              <div className="xl:col-span-1">
                {(showInteractionForm || editingInteraction) && (
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <InteractionForm
                      family={selectedFamily}
                      interaction={editingInteraction}
                      onSubmit={editingInteraction ? handleInteractionUpdate : handleInteractionCreate}
                      onCancel={() => {
                        setShowInteractionForm(false);
                        setEditingInteraction(null);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Válassz egy családot
              </h3>
              <p className="text-gray-500">
                Válaszd ki a családot a bal oldali listából az interakciók megtekintéséhez
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {(showFamilyForm || editingFamily) && (
        <FamilyForm
          family={editingFamily}
          onSubmit={editingFamily ? handleFamilyUpdate : handleFamilyCreate}
          onClose={() => {
            setShowFamilyForm(false);
            setEditingFamily(null);
          }}
        />
      )}
    </div>
  );
};