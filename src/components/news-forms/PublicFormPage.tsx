import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../ui/button';
import { Form, FormComponent, CampusType } from '../../types/form-types';
import { FormRenderer } from './components/FormRenderer';
import { CapacityDisplay } from './components/CapacityDisplay';
import { WaitlistDisplay } from './components/WaitlistDisplay';
import { SubmissionAnimation } from './components/SubmissionAnimation';
import { toast } from 'sonner';
import kindergartenLogo from '../../assets/kindergarten-logo.png';
import decoration1 from '../../assets/decoration-1.png';
import decoration2 from '../../assets/decoration-2.png';
import decoration3 from '../../assets/decoration-3.png';
import decoration4 from '../../assets/decoration-4.png';
import decoration5 from '../../assets/decoration-5.png';
import decoration6 from '../../assets/decoration-6.png';

export const PublicFormPage = () => {
  const { formId } = useParams<{ formId: string }>();
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

      if (error || !data) {
        console.error('Form not found or inactive');
        return;
      }

      const formWithComponents = {
        ...data,
        form_components: (data.form_components as unknown as FormComponent[]) || [],
        campuses: data.campuses as CampusType[]
      };
      setForm(formWithComponents);
    } catch (error) {
      console.error('Error fetching form:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if form is full
  const checkFormCapacity = async () => {
    if (!form || form.unlimited_capacity) return false;
    if (!form.capacity) return false;

    const { count, error } = await supabase
      .from('form_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('form_id', form.id);

    if (error) {
      console.error('Error checking capacity:', error);
      return false;
    }

    return (count || 0) >= form.capacity;
  };

  // Check capacity limits for specific options
  const checkOptionCapacities = async (): Promise<string[]> => {
    if (!form) return [];
    
    const exceededOptions: string[] = [];
    
    // Get all capacity limits for this form
    const { data: capacities, error } = await supabase
      .from('form_option_capacity')
      .select('*')
      .eq('form_id', form.id);

    if (error) {
      console.error('Error checking option capacities:', error);
      return [];
    }

    // Check each selected option against its capacity
    for (const [componentId, value] of Object.entries(formData)) {
      const component = form.form_components.find(c => c.id === componentId);
      if (!component || !['dropdown', 'checkbox', 'radio'].includes(component.type)) continue;

      // Handle different value types
      const selectedOptions = Array.isArray(value) ? value : [value];
      
      for (const selectedOption of selectedOptions) {
        if (!selectedOption) continue;
        
        const capacity = capacities?.find(c => 
          c.component_id === componentId && c.option_value === selectedOption
        );
        
        if (capacity && capacity.current_count >= capacity.max_capacity) {
          exceededOptions.push(selectedOption);
        }
      }
    }
    
    return exceededOptions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) {
      toast.error('Form not found');
      return;
    }

    // Check capacity limits for selected options
    const capacityExceeded = await checkOptionCapacities();
    if (capacityExceeded.length > 0) {
      const optionNames = capacityExceeded.join(', ');
      toast.error(`Sorry, the following options are now full: ${optionNames}`);
      return;
    }

    // Get family name from the first component's answer
    const firstComponent = form.form_components[0];
    const familyNameFromForm = firstComponent ? (formData[firstComponent.id] || `Submission-${Date.now()}`) : `Submission-${Date.now()}`;

    // Validate required fields
    const requiredFields = form.form_components
      .filter((component: FormComponent) => component.required)
      .map((component: FormComponent) => ({ id: component.id, type: component.type, label: component.label }));

    const missingFields = requiredFields.filter(field => {
      const value = formData[field.id];
      
      // Handle different field types
      if (field.type === 'checkbox') {
        // For checkboxes, value should be a non-empty array
        return !Array.isArray(value) || value.length === 0;
      } else if (field.type === 'radio' || field.type === 'dropdown') {
        // For radio buttons and dropdowns, value should exist and not be empty
        return !value || (typeof value === 'string' && !value.trim());
      } else if (field.type === 'file-upload') {
        // For file uploads, value should be an array with files or a single file
        return !value || (Array.isArray(value) && value.length === 0);
      } else {
        // For text inputs and textareas, check if value exists and is not empty string
        return !value || (typeof value === 'string' && !value.trim());
      }
    });

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(f => f.label).join(', ');
      toast.error(`Please fill in all required fields: ${fieldNames}`);
      return;
    }

    // Check option capacities before submitting
    for (const component of form.form_components) {
      if (['dropdown', 'radio', 'checkbox'].includes(component.type)) {
        const value = formData[component.id];
        const selectedOptions = Array.isArray(value) ? value : (value ? [value] : []);
        
        for (const selectedOption of selectedOptions) {
          // Check if this option has a capacity limit
          const { data: capacity, error } = await supabase
            .from('form_option_capacity')
            .select('*')
            .eq('form_id', form.id)
            .eq('component_id', component.id)
            .eq('option_value', selectedOption)
            .single();

          if (error || !capacity) continue; // No capacity limit for this option

          if (capacity.current_count >= capacity.max_capacity) {
            toast.error(`Sorry, "${selectedOption}" is now full. Please choose a different option.`);
            return;
          }
        }
      }
    }

    // Check capacity and determine if this will be a waitlisted submission
    const isFull = await checkFormCapacity();
    
    setSubmitting(true);
    try {
      let waitlistPosition = null;
      
      if (isFull) {
        // Calculate waitlist position
        const { count, error: countError } = await supabase
          .from('form_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('form_id', form.id)
          .eq('waitlisted', true);
          
        if (countError) throw countError;
        waitlistPosition = (count || 0) + 1;
      }

      const { error } = await supabase
        .from('form_submissions')
        .insert({
          form_id: form.id,
          submission_data: formData,
          family_name: String(familyNameFromForm).trim(),
          ip_address: await getClientIP(),
          waitlisted: isFull,
          waitlist_position: waitlistPosition
        });

      if (error) throw error;
      
      if (isFull) {
        toast.success(`Form submitted successfully! You are #${waitlistPosition} on the waitlist.`);
      } else {
        toast.success('Form submitted successfully!');
      }
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error('Error submitting form. Please try again.');
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
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden public-theme-override">
        {/* Background pattern */}
        <div className="fixed inset-0 bg-white">
          <div className="absolute inset-0" 
               style={{
                 background: `radial-gradient(circle at 20% 30%, rgba(125, 211, 192, 0.15) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(107, 199, 181, 0.12) 0%, transparent 40%),
                             radial-gradient(circle at 40% 70%, rgba(125, 211, 192, 0.1) 0%, transparent 60%),
                             radial-gradient(circle at 90% 80%, rgba(107, 199, 181, 0.08) 0%, transparent 45%),
                             radial-gradient(circle at 10% 90%, rgba(125, 211, 192, 0.13) 0%, transparent 55%),
                             radial-gradient(circle at 60% 10%, rgba(107, 199, 181, 0.11) 0%, transparent 50%)`
               }} />
        </div>
        <div className="relative z-10">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden public-theme-override">
        {/* Background pattern */}
        <div className="fixed inset-0 bg-white">
          <div className="absolute inset-0" 
               style={{
                 background: `radial-gradient(circle at 20% 30%, rgba(125, 211, 192, 0.15) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(107, 199, 181, 0.12) 0%, transparent 40%),
                             radial-gradient(circle at 40% 70%, rgba(125, 211, 192, 0.1) 0%, transparent 60%),
                             radial-gradient(circle at 90% 80%, rgba(107, 199, 181, 0.08) 0%, transparent 45%),
                             radial-gradient(circle at 10% 90%, rgba(125, 211, 192, 0.13) 0%, transparent 55%),
                             radial-gradient(circle at 60% 10%, rgba(107, 199, 181, 0.11) 0%, transparent 50%)`
               }} />
        </div>
        <div className="relative z-10 bg-white rounded-[30px] shadow-2xl p-16 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Form not found</h2>
          <p className="text-gray-600">
            The requested form does not exist or is not available.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden p-4 public-theme-override">
        {/* Background pattern */}
        <div className="fixed inset-0 bg-white">
          <div className="absolute inset-0" 
               style={{
                 background: `radial-gradient(circle at 20% 30%, rgba(125, 211, 192, 0.15) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(107, 199, 181, 0.12) 0%, transparent 40%),
                             radial-gradient(circle at 40% 70%, rgba(125, 211, 192, 0.1) 0%, transparent 60%),
                             radial-gradient(circle at 90% 80%, rgba(107, 199, 181, 0.08) 0%, transparent 45%),
                             radial-gradient(circle at 10% 90%, rgba(125, 211, 192, 0.13) 0%, transparent 55%),
                             radial-gradient(circle at 60% 10%, rgba(107, 199, 181, 0.11) 0%, transparent 50%)`
               }} />
        </div>
        <div className="relative z-10 bg-white rounded-[30px] shadow-2xl p-16 text-center max-w-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Thank you!</h2>
          <p className="text-gray-600 mb-6">
            Your form has been submitted successfully. We will contact you soon.
          </p>
          <p className="text-sm text-gray-500">
            You can safely close this window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden public-theme-override">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-white">
        <div className="absolute inset-0" 
             style={{
               background: `radial-gradient(circle at 20% 30%, rgba(125, 211, 192, 0.15) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(107, 199, 181, 0.12) 0%, transparent 40%),
                           radial-gradient(circle at 40% 70%, rgba(125, 211, 192, 0.1) 0%, transparent 60%),
                           radial-gradient(circle at 90% 80%, rgba(107, 199, 181, 0.08) 0%, transparent 45%),
                           radial-gradient(circle at 10% 90%, rgba(125, 211, 192, 0.13) 0%, transparent 55%),
                           radial-gradient(circle at 60% 10%, rgba(107, 199, 181, 0.11) 0%, transparent 50%)`
             }} />
      </div>

      {/* Background decorative images - optimized for mobile */}
      <img src={decoration1} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[8%] left-[5%] -rotate-[15deg] w-[60px] md:w-[120px] hidden sm:block" />
      <img src={decoration2} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[15%] right-[8%] rotate-[25deg] w-[45px] md:w-[90px] hidden sm:block" />
      <img src={decoration3} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[35%] left-[12%] rotate-[45deg] w-[40px] md:w-[80px] hidden sm:block" />
      <img src={decoration4} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[55%] right-[15%] -rotate-[30deg] w-[55px] md:w-[110px] hidden sm:block" />
      <img src={decoration5} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[75%] left-[20%] rotate-[60deg] w-[35px] md:w-[70px] hidden sm:block" />
      <img src={decoration6} alt="" className="fixed z-[2] opacity-15 pointer-events-none top-[12%] left-[35%] -rotate-[45deg] w-[65px] md:w-[130px] hidden sm:block" />

      {/* Main container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 md:px-5 md:py-10 min-h-screen flex flex-col justify-center items-center">
        <div className="text-center bg-white rounded-2xl md:rounded-[30px] shadow-2xl p-8 md:p-16 relative w-full">
          {/* Logo - properly centered */}
          <div className="flex justify-center mb-6 md:mb-8">
            <img 
              src={kindergartenLogo} 
              alt="Under the Rainbow Kindergarten and Nursery" 
              className="w-full max-w-[250px] md:max-w-[400px] h-auto"
            />
          </div>
          
          {/* Capacity Display */}
          {form && <CapacityDisplay form={form} />}
          
          {/* Waitlist Display */}
          {form && <WaitlistDisplay form={form} />}
          
          {/* Form Title */}
          <h1 className="text-2xl font-bold mb-2 text-gray-900">{form.title}</h1>
          {form.description && (
            <p className="text-gray-600 mb-8">{form.description}</p>
          )}
          
          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <FormRenderer
              components={form.form_components}
              values={formData}
              onChange={handleFieldChange}
            />
            
            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                <Send className="h-5 w-5" />
                {submitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            </div>
          </form>
        </div>
        
        <SubmissionAnimation
          isSubmitting={submitting}
          isSubmitted={submitted}
        />
      </div>
    </div>
  );
};