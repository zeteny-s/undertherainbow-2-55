import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Send, Eye, Link2, FileText, Newspaper, Users, Building2 } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner } from '../common/LoadingSpinner';

type TargetOption = 'all' | 'campus' | 'custom';

export const EmailCampaignPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();

  // Get params from URL
  const formId = searchParams.get('formId');
  const formTitle = searchParams.get('formTitle');
  const newsletterId = searchParams.get('newsletterId');
  const newsletterTitle = searchParams.get('newsletterTitle');

  const [recipients, setRecipients] = useState<string[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState(0);
  const [targetOption, setTargetOption] = useState<TargetOption>('all');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sending, setSending] = useState(false);

  const [emailData, setEmailData] = useState({
    subject: newsletterTitle 
      ? `New Newsletter: ${newsletterTitle}` 
      : formTitle 
      ? `New Form Available: ${formTitle}`
      : '',
    content: newsletterTitle
      ? `Dear families,\n\nWe're excited to share our latest newsletter with you!\n\nClick the button below to read it:\n\n[NEWSLETTER_LINK]\n\nBest regards,\nUnder the Rainbow Kindergarten Team`
      : formTitle
      ? `Dear families,\n\nWe have a new form available for you to fill out.\n\nClick the button below to access the form:\n\n[FORM_LINK]\n\nBest regards,\nUnder the Rainbow Kindergarten Team`
      : 'Dear families,\n\n\n\nBest regards,\nUnder the Rainbow Kindergarten Team',
    buttonText: newsletterTitle ? 'Read Newsletter' : formTitle ? 'Fill Form' : '',
    buttonUrl: newsletterTitle 
      ? `${window.location.origin}/newsletter/${newsletterId}` 
      : formTitle 
      ? `${window.location.origin}/form/${formId}` 
      : ''
  });

  // Load contacts when target option changes
  useEffect(() => {
    if (targetOption !== 'custom') {
      loadContacts();
    }
  }, [targetOption, selectedCampus]);

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
              if (line.trim() === '[NEWSLETTER_LINK]' && newsletterTitle) {
                return `<div style="text-align: center;"><a href="${emailData.buttonUrl}" class="button">${emailData.buttonText || 'Read Newsletter'}</a></div>`;
              }
              if (line.trim() === '[FORM_LINK]' && formTitle) {
                return `<div style="text-align: center;"><a href="${emailData.buttonUrl}" class="button">${emailData.buttonText || 'Fill Form'}</a></div>`;
              }
              return `<p>${line}</p>`;
            }).join('')}
            ${hasButton && !newsletterTitle && !formTitle ? `
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
      navigate(-1);
    } catch (error: any) {
      console.error('Error sending email:', error);
      addNotification('error', error.message || 'Failed to send email campaign.');
    } finally {
      setSending(false);
    }
  };

  if (!formId && !newsletterId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Invalid Campaign</h1>
          <p className="text-muted-foreground mb-6">No form or newsletter specified.</p>
          <Button onClick={() => navigate('/news-forms')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News & Forms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-light tracking-tight text-foreground">
                Email Campaign
              </h1>
              <p className="text-muted-foreground">
                Send {newsletterTitle ? 'newsletter' : 'form'} to families
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            {/* Target Selection */}
            <Card className="border-0 shadow-md bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="all"
                      checked={targetOption === 'all'}
                      onChange={() => setTargetOption('all')}
                      className="w-4 h-4 text-primary"
                    />
                    <label htmlFor="all" className="text-sm font-medium">All families</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="campus"
                      checked={targetOption === 'campus'}
                      onChange={() => setTargetOption('campus')}
                      className="w-4 h-4 text-primary"
                    />
                    <label htmlFor="campus" className="text-sm font-medium">Specific campus</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="custom"
                      checked={targetOption === 'custom'}
                      onChange={() => setTargetOption('custom')}
                      className="w-4 h-4 text-primary"
                    />
                    <label htmlFor="custom" className="text-sm font-medium">Custom recipients</label>
                  </div>
                </div>
                
                {targetOption === 'campus' && (
                  <div className="ml-6">
                    <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Campuses</SelectItem>
                        <SelectItem value="Feketerigó">Feketerigó</SelectItem>
                        <SelectItem value="Torockó">Torockó</SelectItem>
                        <SelectItem value="Levél">Levél</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-2 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    <Building2 className="h-3 w-3 inline mr-1" />
                    {loadingContacts ? 'Loading...' : `${selectedFamilies} families`}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                    <Mail className="h-3 w-3 inline mr-1" />
                    {loadingContacts ? 'Loading...' : `${recipients.length} emails`}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Email Composition */}
            <Card className="border-0 shadow-md bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                    placeholder="Enter email subject..."
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Email Content</Label>
                  <Textarea
                    id="content"
                    rows={8}
                    value={emailData.content}
                    onChange={(e) => setEmailData({...emailData, content: e.target.value})}
                    placeholder="Write your email content here..."
                    className="resize-none"
                  />
                </div>

                {/* Action Button Configuration */}
                {(!newsletterTitle && !formTitle) && (
                  <div className="space-y-2">
                    <Label>Action Button (Optional)</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Button text (e.g., 'Visit Website')"
                        value={emailData.buttonText}
                        onChange={(e) => setEmailData({...emailData, buttonText: e.target.value})}
                      />
                      <Input
                        type="url"
                        placeholder="Button URL (e.g., 'https://example.com')"
                        value={emailData.buttonUrl}
                        onChange={(e) => setEmailData({...emailData, buttonUrl: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* Prefilled Link Display */}
                {(newsletterTitle || formTitle) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      {newsletterTitle ? <Newspaper className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      <span className="font-medium">
                        {newsletterTitle ? 'Newsletter' : 'Form'}: {newsletterTitle || formTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Link2 className="h-3 w-3" />
                      <span>{emailData.buttonUrl}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Button */}
            <Button 
              onClick={handleSendEmail} 
              disabled={sending || recipients.length === 0 || loadingContacts}
              size="lg"
              className="w-full"
            >
              {sending ? (
                <LoadingSpinner />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {recipients.length} recipients
                </>
              )}
            </Button>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            <Card className="border-0 shadow-md bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Email Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg p-4 bg-white min-h-[400px] text-sm overflow-auto"
                  dangerouslySetInnerHTML={{ __html: generateEmailHTML() }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};