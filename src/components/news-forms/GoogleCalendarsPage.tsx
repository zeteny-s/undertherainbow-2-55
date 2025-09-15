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
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Google Calendar Management</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create calendars, schedule classes and events, or upload PDF schedules for automatic processing.
        </p>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Class Calendar */}
        <Card 
          className="border-2 border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer" 
          onClick={() => {
            setCalendarForm({ ...calendarForm, title: 'Class Schedule - ' });
            setShowCreateForm(true);
          }}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            <CardTitle className="text-blue-700">Create Class Calendar</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set up a calendar for regular classes with recurring schedules
            </p>
          </CardHeader>
        </Card>

        {/* Create Event Calendar */}
        <Card 
          className="border-2 border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer"
          onClick={() => {
            setCalendarForm({ ...calendarForm, title: 'Events - ' });
            setShowCreateForm(true);
          }}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-green-700">Create Event Calendar</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create a calendar for special events, meetings, and activities
            </p>
          </CardHeader>
        </Card>

        {/* Upload PDF Schedule */}
        <Card 
          className="border-2 border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer"
          onClick={() => {
            const pdfSection = document.getElementById('pdf-upload-section');
            pdfSection?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
            <CardTitle className="text-purple-700">Upload PDF Schedule</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload a PDF and automatically extract events to your calendar
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      {calendars.length > 0 && (
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => setShowEventForm(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Single Event
          </Button>
        </div>
      )}

      {/* Create Calendar Form */}
      {showCreateForm && (
        <Card className="border-2 border-blue-500/30 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-blue-700">Create New Google Calendar</CardTitle>
            <p className="text-sm text-muted-foreground">
              This will create a new Google Calendar that you can share publicly or privately
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCalendar} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Calendar Name</label>
                <Input
                  placeholder="e.g., 'Math Classes Fall 2024' or 'School Events'"
                  value={calendarForm.title}
                  onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  placeholder="Describe what this calendar will be used for..."
                  value={calendarForm.description}
                  onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Campus Location</label>
                <Select
                  value={calendarForm.campus}
                  onValueChange={(value) => setCalendarForm({ ...calendarForm, campus: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feketerigó">Feketerigó Campus</SelectItem>
                    <SelectItem value="Torockó">Torockó Campus</SelectItem>
                    <SelectItem value="Levél">Levél Campus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3">
                <Button type="submit" disabled={isCreatingCalendar} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {isCreatingCalendar ? 'Creating Calendar...' : 'Create Google Calendar'}
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
      <Card id="pdf-upload-section" className="border-2 border-purple-500/20 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Clock className="h-6 w-6" />
            Upload PDF Schedule
          </CardTitle>
          <p className="text-muted-foreground">
            Upload a PDF schedule and our AI will automatically extract events and add them to your selected Google Calendar.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {calendars.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Create a calendar first to upload PDF schedules</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Target Calendar</label>
                <Select
                  value={selectedCalendar}
                  onValueChange={setSelectedCalendar}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose which calendar to add events to" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((calendar) => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        {calendar.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <label className="text-sm font-medium">Upload PDF File</label>
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center bg-white hover:bg-purple-50/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:transition-colors"
                    id="pdf-upload"
                  />
                  <div className="mt-4">
                    {pdfFile ? (
                      <div className="text-green-600 font-medium">✓ {pdfFile.name}</div>
                    ) : (
                      <div className="text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">Drag & drop your PDF or click to browse</p>
                        <p className="text-sm">Supports class schedules, event listings, and timetables</p>
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={processPdfCalendar} 
                  disabled={!pdfFile || !selectedCalendar || isProcessingPdf}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isProcessingPdf ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Processing PDF with AI...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5 mr-2" />
                      Extract Events from PDF
                    </>
                  )}
                </Button>
              </div>

              {extractedEvents.length > 0 && (
                <div className="space-y-4 mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-green-800">
                      ✓ Extracted {extractedEvents.length} Events
                    </h3>
                    <Button 
                      onClick={addParsedEventsToCalendar} 
                      disabled={!selectedCalendar || loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? 'Adding Events...' : 'Add All to Calendar'}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {extractedEvents.map((event, index) => (
                      <div key={index} className="p-3 bg-white border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-800">{event.title}</h4>
                        <p className="text-sm text-green-600">
                          {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                        </p>
                        {event.teacher && <p className="text-sm text-gray-600">Teacher: {event.teacher}</p>}
                        {event.description && <p className="text-sm text-gray-500">{event.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Event Form */}
      {showEventForm && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Create Calendar Event
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Add a single event or create recurring events (classes, meetings, etc.) to your Google Calendar.
            </p>
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

              {/* Recurring Event Section */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={eventForm.recurring}
                    onChange={(e) => setEventForm({ ...eventForm, recurring: e.target.checked })}
                    className="rounded w-4 h-4"
                    id="recurring-checkbox"
                  />
                  <label htmlFor="recurring-checkbox" className="text-sm font-medium cursor-pointer">
                    Make this a recurring event (for classes, weekly meetings, etc.)
                  </label>
                </div>

                {eventForm.recurring && (
                  <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">Repeat Frequency</label>
                        <Select value={eventForm.recurringType} onValueChange={(value) => setEventForm({ ...eventForm, recurringType: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Every Day</SelectItem>
                            <SelectItem value="weekly">Every Week (Same Day)</SelectItem>
                            <SelectItem value="monthly">Every Month (Same Date)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-2">Recurrence End Date</label>
                        <Input
                          type="date"
                          value={eventForm.recurringEnd}
                          onChange={(e) => setEventForm({ ...eventForm, recurringEnd: e.target.value })}
                          placeholder="When should it stop repeating?"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                      <strong>Tip:</strong> Use recurring events for regular classes, weekly meetings, or semester-long schedules.
                      The event will repeat {eventForm.recurringType} until {eventForm.recurringEnd || 'you specify an end date'}.
                    </div>
                  </div>
                )}
              </div>

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
