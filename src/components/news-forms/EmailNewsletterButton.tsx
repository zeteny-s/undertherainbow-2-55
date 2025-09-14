import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

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
  const navigate = useNavigate();

  const handleEmailCampaign = () => {
    navigate(`/email-campaign?newsletterId=${newsletterId}&newsletterTitle=${encodeURIComponent(newsletterTitle)}`);
  };

  return (
    <button
      onClick={handleEmailCampaign}
      className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 ${className}`}
    >
      <Mail className="h-4 w-4" />
      Email to Families
    </button>
  );
};