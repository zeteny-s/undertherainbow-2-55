import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { EmailCampaignModal } from '../family-relationships/EmailCampaignModal';

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

  const handleEmailCampaign = () => {
    setShowEmailModal(true);
  };

  return (
    <>
      <button
        onClick={handleEmailCampaign}
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 ${className}`}
      >
        <Mail className="h-4 w-4" />
        Email to Families
      </button>

      <EmailCampaignModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        prefilledForm={{
          id: formId,
          title: formTitle,
          url: `${window.location.origin}/form/${formId}`
        }}
      />
    </>
  );
};