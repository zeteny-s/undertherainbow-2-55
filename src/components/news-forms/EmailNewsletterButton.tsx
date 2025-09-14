import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { EmailCampaignModal } from '../family-relationships/EmailCampaignModal';

interface EmailNewsletterButtonProps {
  newsletterId: string;
  newsletterTitle: string;
  className?: string;
}

export const EmailNewsletterButton: React.FC<EmailNewsletterButtonProps> = ({
  newsletterId,
  newsletterTitle,
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
        prefilledNewsletter={{
          id: newsletterId,
          title: newsletterTitle,
          url: `${window.location.origin}/newsletter/${newsletterId}`
        }}
      />
    </>
  );
};