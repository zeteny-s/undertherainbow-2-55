import React, { useState, useEffect } from 'react';
import { X, Mail, Send, Eye, Link2, FileText, Newspaper } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useNotifications } from '../../hooks/useNotifications';

interface EmailCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients?: string[];
  selectedFamilies?: number;
  prefilledNewsletter?: {
    id: string;
    title: string;
    url: string;
  };
  prefilledForm?: {
    id: string;
    title: string;
    url: string;
  };
}

export const EmailCampaignModal: React.FC<EmailCampaignModalProps> = ({
  isOpen,
  onClose,
  recipients: propRecipients,
  selectedFamilies: propSelectedFamilies,
  prefilledNewsletter,
  prefilledForm
}) => {
  const { addNotification } = useNotifications();
  const [recipients, setRecipients] = useState<string[]>(propRecipients || []);
  const [selectedFamilies, setSelectedFamilies] = useState(propSelectedFamilies || 0);
  const [targetOption, setTargetOption] = useState<'all' | 'campus' | 'custom'>('all');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [loadingContacts, setLoadingContacts] = useState(false);
  
  // Load contacts when target option changes
  useEffect(() => {
    if (isOpen && targetOption !== 'custom') {
      loadContacts();
    }
  }, [isOpen, targetOption, selectedCampus]);

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      let query = supabase
        .from('family_contacts')
        .select('mother_email, father_email, additional_emails, campus');

      if (targetOption === 'campus' && selectedCampus !== 'all') {
        query = query.eq('campus', selectedCampus);
      }

      const { data: contacts, error } = await query;

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
      setSelectedFamilies(contacts?.length || 0);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      addNotification('error', 'Failed to load family contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const [emailData, setEmailData] = useState({
    subject: prefilledNewsletter 
      ? `New Newsletter: ${prefilledNewsletter.title}` 
      : prefilledForm 
      ? `New Form Available: ${prefilledForm.title}`
      : '',
    content: prefilledNewsletter
      ? `Dear families,\n\nWe're excited to share our latest newsletter with you!\n\nClick the button below to read it:\n\n[NEWSLETTER_LINK]\n\nBest regards,\nUnder the Rainbow Kindergarten Team`
      : prefilledForm
      ? `Dear families,\n\nWe have a new form available for you to fill out.\n\nClick the button below to access the form:\n\n[FORM_LINK]\n\nBest regards,\nUnder the Rainbow Kindergarten Team`
      : 'Dear families,\n\n\n\nBest regards,\nUnder the Rainbow Kindergarten Team',
    buttonText: prefilledNewsletter ? 'Read Newsletter' : prefilledForm ? 'Fill Form' : '',
    buttonUrl: prefilledNewsletter?.url || prefilledForm?.url || ''
  });
  const [sending, setSending] = useState(false);

  const generateEmailHTML = () => {
    const hasButton = emailData.buttonText && emailData.buttonUrl;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailData.subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
          .logo { color: #6366f1; font-size: 24px; font-weight: bold; }
          .content { padding: 30px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .button:hover { background-color: #5855eb; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌈 Under the Rainbow Kindergarten</div>
          </div>
          <div class="content">
            ${emailData.content.split('\n').map(line => {
              if (line.trim() === '[NEWSLETTER_LINK]' && prefilledNewsletter) {
                return `<div style="text-align: center;"><a href="${prefilledNewsletter.url}" class="button">${emailData.buttonText || 'Read Newsletter'}</a></div>`;
              }
              if (line.trim() === '[FORM_LINK]' && prefilledForm) {
                return `<div style="text-align: center;"><a href="${prefilledForm.url}" class="button">${emailData.buttonText || 'Fill Form'}</a></div>`;
              }
              return `<p>${line}</p>`;
            }).join('')}
            ${hasButton && !prefilledNewsletter && !prefilledForm ? `
              <div style="text-align: center;">
                <a href="${emailData.buttonUrl}" class="button">${emailData.buttonText}</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>Under the Rainbow Kindergarten<br>
            Budapest, Hungary<br>
            <a href="mailto:info@undertherainbow.hu">info@undertherainbow.hu</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSendEmail = async () => {
    if (!emailData.subject.trim()) {
      addNotification('error', 'Please add an email subject.');
      return;
    }

    if (!emailData.content.trim()) {
      addNotification('error', 'Please add email content.');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-gmail', {
        body: {
          to: recipients,
          subject: emailData.subject,
          htmlContent: generateEmailHTML(),
          fromName: 'Under the Rainbow Kindergarten'
        }
      });

      if (error) throw error;

      addNotification('success', `Email campaign sent to ${recipients.length} recipients!`);
      onClose();
    } catch (error: any) {
      console.error('Error sending email:', error);
      addNotification('error', error.message || 'Failed to send email campaign.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl border shadow-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Mail className="w-5 h-5" />
            Email Campaign
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-50" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid gap-6 md:grid-cols-2">
          {/* Compose Section */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Campaign Details</h3>
              
              {/* Target Selection */}
              <div className="space-y-4 mb-6">
                <label className="block text-sm font-medium">Send to</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="all"
                      checked={targetOption === 'all'}
                      onChange={() => setTargetOption('all')}
                      className="w-4 h-4 text-primary"
                    />
                    <label htmlFor="all" className="text-sm">All families</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="campus"
                      checked={targetOption === 'campus'}
                      onChange={() => setTargetOption('campus')}
                      className="w-4 h-4 text-primary"
                    />
                    <label htmlFor="campus" className="text-sm">Specific campus</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="custom"
                      checked={targetOption === 'custom'}
                      onChange={() => setTargetOption('custom')}
                      className="w-4 h-4 text-primary"
                    />
                    <label htmlFor="custom" className="text-sm">Use pre-selected recipients</label>
                  </div>
                </div>
                
                {targetOption === 'campus' && (
                  <div className="ml-6">
                    <select
                      value={selectedCampus}
                      onChange={(e) => setSelectedCampus(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="all">All Campuses</option>
                      <option value="Feketerigó">Feketerigó</option>
                      <option value="Torockó">Torockó</option>
                      <option value="Levél">Levél</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2 text-sm text-gray-600 mb-4">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {loadingContacts ? 'Loading...' : `${selectedFamilies} families`}
                </span>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                  {loadingContacts ? 'Loading...' : `${recipients.length} emails`}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subject Line</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                    placeholder="Enter email subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email Content</label>
                  <textarea
                    rows={8}
                    className="w-full border rounded-lg px-3 py-2 resize-none"
                    value={emailData.content}
                    onChange={(e) => setEmailData({...emailData, content: e.target.value})}
                    placeholder="Write your email content here..."
                  />
                </div>

                {/* Action Button Configuration */}
                {(!prefilledNewsletter && !prefilledForm) && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Action Button (Optional)</label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Button text (e.g., 'Visit Website')"
                        value={emailData.buttonText}
                        onChange={(e) => setEmailData({...emailData, buttonText: e.target.value})}
                      />
                      <input
                        type="url"
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Button URL (e.g., 'https://example.com')"
                        value={emailData.buttonUrl}
                        onChange={(e) => setEmailData({...emailData, buttonUrl: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* Prefilled Link Display */}
                {(prefilledNewsletter || prefilledForm) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      {prefilledNewsletter ? <Newspaper className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      <span className="font-medium">
                        {prefilledNewsletter ? 'Newsletter' : 'Form'}: {prefilledNewsletter?.title || prefilledForm?.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Link2 className="h-3 w-3" />
                      <span>{prefilledNewsletter?.url || prefilledForm?.url}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Email Preview
              </h3>
              <div 
                className="border rounded-lg p-4 bg-white min-h-[400px] text-sm"
                dangerouslySetInnerHTML={{ __html: generateEmailHTML() }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-between">
          <button 
            className="px-4 py-2 rounded-lg border hover:bg-gray-50" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            onClick={handleSendEmail} 
            disabled={sending || recipients.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? 'Sending...' : `Send to ${recipients.length} recipients`}
          </button>
        </div>
      </div>
    </div>
  );
};