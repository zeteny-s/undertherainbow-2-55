import React, { useState } from 'react';
import { X, Users, UserPlus, Save } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useNotifications } from '../../hooks/useNotifications';
import ErpLayout from './ErpLayout';

interface CreateTeamModalProps {
  onClose: () => void;
  onTeamCreated: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  onClose,
  onTeamCreated,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addNotification('error', 'A csapat neve kötelező');
      return;
    }

    setLoading(true);
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
          },
        ])
        .select()
        .single();

      if (teamError) throw teamError;

      // Add current user as team lead
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert([
            {
              team_id: team.id,
              user_id: user.id,
              role: 'lead',
            },
          ]);

        if (memberError) {
          console.error('Error adding user as team member:', memberError);
        }
      }

      addNotification('success', 'Csapat sikeresen létrehozva');
      onTeamCreated();
    } catch (error) {
      console.error('Error creating team:', error);
      addNotification('error', 'Hiba történt a csapat létrehozásakor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <ErpLayout>
        <div className="relative w-full max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Új Csapat Létrehozása</h2>
                <p className="text-sm text-muted-foreground">Hozza létre az új csapatot</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Csapat neve *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Adja meg a csapat nevét"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Leírás
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Opcionális leírás a csapatról"
                  rows={4}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
                />
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <UserPlus className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Automatikus csapattag</p>
                  <p>Ön automatikusan csatlakozik a csapathoz vezetőként létrehozás után.</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors"
                disabled={loading}
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? 'Létrehozás...' : 'Csapat Létrehozása'}
              </button>
            </div>
          </form>
        </div>
      </ErpLayout>
    </div>
  );
};