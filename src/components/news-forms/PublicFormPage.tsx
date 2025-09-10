import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormComponent } from '@/types/form-types';
import { FormRenderer } from './components/FormRenderer';
import { toast } from 'sonner';

export const PublicFormPage = () => {
  const { formId } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    if (!formId) return;

    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setForm(data);
    } catch (error) {
      console.error('Error fetching form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;

    // Validate required fields
    const requiredFields = form.form_components
      .filter(component => component.required)
      .map(component => component.id);

    const missingFields = requiredFields.filter(fieldId => 
      !formData[fieldId] || (typeof formData[fieldId] === 'string' && !formData[fieldId].trim())
    );

    if (missingFields.length > 0) {
      toast.error('Kérjük, töltse ki az összes kötelező mezőt');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('form_submissions')
        .insert({
          form_id: form.id,
          submission_data: formData,
          ip_address: await getClientIP()
        });

      if (error) throw error;
      
      setSubmitted(true);
      toast.success('Űrlap sikeresen elküldve!');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Hiba történt az űrlap elküldésekor');
    } finally {
      setSubmitting(false);
    }
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return null;
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Űrlap nem található</h2>
            <p className="text-muted-foreground">
              A keresett űrlap nem létezik vagy nem érhető el.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Köszönjük!</h2>
            <p className="text-muted-foreground mb-6">
              Az űrlapot sikeresen elküldte. Hamarosan felvesszük Önnel a kapcsolatot.
            </p>
            <p className="text-sm text-muted-foreground">
              Biztonságosan bezárhatja ezt az ablakot.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Fixed Template Header */}
        <div className="mb-8 text-center">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-16 mx-auto mb-4"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.campus} Campus</h1>
            <p className="text-gray-600">Gyermekvédelmi Szakellátás</p>
          </div>
        </div>

        {/* Form Content Area */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl font-bold">{form.title}</CardTitle>
            {form.description && (
              <p className="text-muted-foreground mt-2">{form.description}</p>
            )}
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormRenderer
                components={form.form_components}
                values={formData}
                onChange={handleFieldChange}
              />
              
              <div className="pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  <Send className="h-5 w-5" />
                  {submitting ? 'Küldés...' : 'Űrlap elküldése'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2024 Gyermekvédelmi Szakellátás. Minden jog fenntartva.</p>
        </div>
      </div>
    </div>
  );
};