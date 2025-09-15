import { useState, useEffect } from 'react';
import { Plus, Calendar, ExternalLink, Clock } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { toast } from 'sonner';

interface GoogleCalendar {
  id: string;
  title: string;
  description?: string;
  google_calendar_id: string;
  share_link: string;
  campus: string;
  created_at: string;
  calendar_events_google?: { count: number }[];
}

interface CalendarEvent {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  teacher?: string;
  eventType?: string;
  recurring?: boolean;
  recurringType?: string;
  recurringEnd?: string;
}

export const GoogleCalendarsPage = () => {
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [isCreatingCalendar, setIsCreatingCalendar] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedEvents, setExtractedEvents] = useState<any[]>([]);

  // Form states
  const [calendarForm, setCalendarForm] = useState({
    title: '',
    description: '',
    campus: 'Feketerigó' as const
  });

  const [eventForm, setEventForm] = useState<CalendarEvent>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    teacher: '',
    eventType: 'general',
    recurring: false,
    recurringType: 'weekly',
    recurringEnd: ''
  });

  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchCalendars = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'list_calendars' }
      });

      if (error) throw error;
      setCalendars(data.calendars || []);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      toast.error('Failed to fetch calendars');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsCreatingCalendar(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'create_calendar',
          calendarData: calendarForm
        }
      });

      if (error) throw error;
      toast.success('Google Calendar created successfully! Share link is available.');
      setShowCreateForm(false);
      setCalendarForm({ title: '', description: '', campus: 'Feketerigó' });
      fetchCalendars();
    } catch (error: any) {
      console.error('Error creating calendar:', error);
      toast.error(error.message || 'Failed to create calendar');
    } finally {
      setIsCreatingCalendar(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalendar) return;

    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'add_event',
          eventData: {
            calendarId: selectedCalendar,
            ...eventForm
          }
        }
      });

      if (error) throw error;
      toast.success('Event added to Google Calendar!');
      setShowEventForm(false);
      setEventForm({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        teacher: '',
        eventType: 'general',
        recurring: false,
        recurringType: 'weekly',
        recurringEnd: ''
      });
      fetchCalendars();
    } catch (error: any) {
      console.error('Error adding event:', error);
      toast.error(error.message || 'Failed to add event');
    } finally {
      setLoading(false);
    }
  };

  const processPdfCalendar = async () => {
    if (!pdfFile || !selectedCalendar) return;

    setIsProcessingPdf(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('google-calendar', {
          body: {
            action: 'parse_pdf_calendar',
            pdfContent: base64Content,
            calendarId: selectedCalendar
          }
        });

        if (error) throw error;
        
        setExtractedEvents(data.extractedEvents || []);
        toast.success('PDF processed! Review events before adding to calendar.');
      };
      reader.readAsDataURL(pdfFile);
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      toast.error('Failed to process PDF: ' + error.message);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const addParsedEventsToCalendar = async () => {
    if (!selectedCalendar || extractedEvents.length === 0) return;

    try {
      setLoading(true);
      for (const event of extractedEvents) {
        await supabase.functions.invoke('google-calendar', {
          body: {
            action: 'add_event',
            eventData: {
              ...event,
              calendarId: selectedCalendar
            }
          }
        });
      }
      
      setExtractedEvents([]);
      setPdfFile(null);
      toast.success(`${extractedEvents.length} events added to Google Calendar!`);
      fetchCalendars();
    } catch (error: any) {
      console.error('Error adding events:', error);
      toast.error('Failed to add events: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = (shareLink: string) => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Share link copied to clipboard!');
  };

  if (loading && calendars.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Google Calendar
        </Button>
        <Button
          onClick={() => setShowEventForm(true)}
          variant="outline"
          disabled={calendars.length === 0}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Create Calendar Form */}
      {showCreateForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Create New Google Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCalendar} className="space-y-4">
              <Input
                placeholder="Calendar Title"
                value={calendarForm.title}
                onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="Calendar Description (optional)"
                value={calendarForm.description}
                onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
              />
              <Select
                value={calendarForm.campus}
                onValueChange={(value) => setCalendarForm({ ...calendarForm, campus: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Feketerigó">Feketerigó</SelectItem>
                  <SelectItem value="Torockó">Torockó</SelectItem>
                  <SelectItem value="Levél">Levél</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button type="submit" disabled={isCreatingCalendar}>
                  {isCreatingCalendar ? 'Creating...' : 'Create Google Calendar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* PDF Upload Section */}
      {calendars.length > 0 && (
        <Card className="border-2 border-secondary/20">
          <CardHeader>
            <CardTitle>Upload PDF Calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={selectedCalendar}
              onValueChange={setSelectedCalendar}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select calendar to add events to" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((calendar) => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    {calendar.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="space-y-2">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <Button 
                onClick={processPdfCalendar} 
                disabled={!pdfFile || !selectedCalendar || isProcessingPdf}
                className="w-full"
              >
                {isProcessingPdf ? 'Processing...' : 'Extract Events from PDF'}
              </Button>
            </div>

            {extractedEvents.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Extracted Events ({extractedEvents.length})</h3>
                  <Button onClick={addParsedEventsToCalendar} disabled={!selectedCalendar || loading}>
                    {loading ? 'Adding...' : 'Add All to Calendar'}
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {extractedEvents.map((event, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                      </p>
                      {event.teacher && <p className="text-sm">Teacher: {event.teacher}</p>}
                      {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Event Form */}
      {showEventForm && (
        <Card className="border-2 border-secondary/20">
          <CardHeader>
            <CardTitle>Add Event to Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <Select
                value={selectedCalendar}
                onValueChange={setSelectedCalendar}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Calendar" />
                </SelectTrigger>
                <SelectContent>
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      {calendar.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Event Title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="Event Description (optional)"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="datetime-local"
                  placeholder="Start Time"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                  required
                />
                <Input
                  type="datetime-local"
                  placeholder="End Time"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Teacher (optional)"
                  value={eventForm.teacher}
                  onChange={(e) => setEventForm({ ...eventForm, teacher: e.target.value })}
                />
                <Select
                  value={eventForm.eventType}
                  onValueChange={(value) => setEventForm({ ...eventForm, eventType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={eventForm.recurring}
                  onChange={(e) => setEventForm({ ...eventForm, recurring: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">Recurring Event</label>
              </div>

              {eventForm.recurring && (
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">Repeat</label>
                    <Select value={eventForm.recurringType} onValueChange={(value) => setEventForm({ ...eventForm, recurringType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={eventForm.recurringEnd}
                      onChange={(e) => setEventForm({ ...eventForm, recurringEnd: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading || !selectedCalendar}>
                  Add to Google Calendar
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowEventForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Calendars Grid */}
      {calendars.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <EmptyState 
            icon={Calendar}
            title="No Google Calendars Found"
            description="Create your first Google Calendar to get started with event management"
            action={{
              label: "Create First Calendar",
              onClick: () => setShowCreateForm(true)
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {calendars.map((calendar) => (
            <Card key={calendar.id} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {calendar.title}
                    </CardTitle>
                    {calendar.description && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {calendar.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => copyShareLink(calendar.share_link)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Copy Share Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(calendar.share_link, '_blank')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        View Google Calendar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {calendar.campus}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {new Date(calendar.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Events:</span>
                    <span className="font-medium">
                      {calendar.calendar_events_google?.[0]?.count || 0}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <a 
                      href={calendar.share_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      View Calendar <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyShareLink(calendar.share_link)}
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};