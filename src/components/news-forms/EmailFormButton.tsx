import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { EmailCampaignModal } from '../family-relationships/EmailCampaignModal';
import { supabase } from '../../integrations/supabase/client';

interface EmailFormButtonProps {
  formId: string;
  formTitle: string;
  className?: string;
}

export const EmailFormButton: React.FC<EmailFormButtonProps> = ({
  formId,
  formTitle,
  className
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleEmailCampaign = async () => {
    setLoading(true);
    try {
      // Fetch all family contacts
      const { data: contacts, error } = await supabase
        .from('family_contacts')
        .select('mother_email, father_email, additional_emails');

      if (error) throw error;

      // Collect all unique emails
      const allEmails: string[] = [];
      contacts?.forEach((contact: any) => {
        if (contact.mother_email) allEmails.push(contact.mother_email);
        if (contact.father_email) allEmails.push(contact.father_email);
        if (contact.additional_emails) allEmails.push(...contact.additional_emails);
      });

      const uniqueEmails = [...new Set(allEmails)];
      setRecipients(uniqueEmails);
      setShowEmailModal(true);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleEmailCampaign}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 ${className}`}
      >
        <Mail className="h-4 w-4" />
        {loading ? 'Loading...' : 'Email to Families'}
      </button>

      <EmailCampaignModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        recipients={recipients}
        selectedFamilies={recipients.length}
        prefilledForm={{
          id: formId,
          title: formTitle,
          url: `${window.location.origin}/form/${formId}`
        }}
      />
    </>
  );
};