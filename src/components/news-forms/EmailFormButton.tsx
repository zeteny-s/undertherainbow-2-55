import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

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
  const navigate = useNavigate();

  const handleEmailCampaign = () => {
    navigate(`/email-campaign?formId=${formId}&formTitle=${encodeURIComponent(formTitle)}`);
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