import { useState, useEffect } from 'react';
import { Plus, Calendar, Upload, ExternalLink, Clock } from 'lucide-react';
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
}

export const GoogleCalendarsPage = () => {
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');

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
    eventType: 'general'
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

    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'create_calendar',
          calendarData: calendarForm
        }
      });

      if (error) throw error;
      toast.success('Calendar created successfully!');
      setShowCreateForm(false);
      setCalendarForm({ title: '', description: '', campus: 'Feketerigó' });
      fetchCalendars();
    } catch (error: any) {
      console.error('Error creating calendar:', error);
      toast.error(error.message || 'Failed to create calendar');
    } finally {
      setLoading(false);
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
      toast.success('Event added successfully!');
      setShowEventForm(false);
      setEventForm({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        teacher: '',
        eventType: 'general'
      });
      fetchCalendars();
    } catch (error: any) {
      console.error('Error adding event:', error);
      toast.error(error.message || 'Failed to add event');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    try {
      // Convert file to base64 for processing
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        const base64Content = fileReader.result as string;
        
        const { data, error } = await supabase.functions.invoke('google-calendar', {
          body: {
            action: 'parse_pdf_calendar',
            pdfContent: base64Content
          }
        });

        if (error) throw error;
        
        // For now, show extracted events in console (would show in modal for review)
        console.log('Extracted events:', data.extractedEvents);
        toast.success('PDF processed! Check console for extracted events');
      };
      
      fileReader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      toast.error(error.message || 'Failed to process PDF');
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
          Create Calendar
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
                <Button type="submit" disabled={loading}>
                  Create Calendar
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
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
              <div className="flex gap-2">
                <Button type="submit" disabled={loading || !selectedCalendar}>
                  Add Event
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
            title="No Calendars Found"
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
                        View Calendar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <label className="flex items-center cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload PDF Calendar
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePdfUpload(file);
                            }}
                          />
                        </label>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};