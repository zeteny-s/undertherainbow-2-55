import { useState, useEffect } from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { supabase } from '../../../integrations/supabase/client';

interface GoogleCalendar {
  id: string;
  title: string;
  share_link: string;
}

interface CalendarButtonProps {
  selectedCalendarId?: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  onCalendarSelect?: (calendarId: string) => void;
  isEditing?: boolean;
}

export const CalendarButton = ({
  selectedCalendarId = '',
  buttonText = 'Add to my calendar',
  variant = 'default',
  size = 'default',
  className = '',
  onCalendarSelect,
  isEditing = false,
}: CalendarButtonProps) => {
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<GoogleCalendar | null>(null);

  useEffect(() => {
    fetchCalendars();
  }, []);

  useEffect(() => {
    if (selectedCalendarId && calendars.length > 0) {
      const calendar = calendars.find(c => c.id === selectedCalendarId);
      setSelectedCalendar(calendar || null);
    }
  }, [selectedCalendarId, calendars]);

  const fetchCalendars = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'list_calendars' }
      });

      if (error) throw error;
      setCalendars(data.calendars || []);
    } catch (error) {
      console.error('Error fetching calendars:', error);
    }
  };

  const handleCalendarSelect = (calendarId: string) => {
    const calendar = calendars.find(c => c.id === calendarId);
    setSelectedCalendar(calendar || null);
    onCalendarSelect?.(calendarId);
  };

  const handleButtonClick = () => {
    if (selectedCalendar && !isEditing) {
      window.open(selectedCalendar.share_link, '_blank');
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Calendar</label>
        <Select value={selectedCalendarId} onValueChange={handleCalendarSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a calendar..." />
          </SelectTrigger>
          <SelectContent>
            {calendars.map((calendar) => (
              <SelectItem key={calendar.id} value={calendar.id}>
                {calendar.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">
          Preview: This will show as a "{buttonText}" button
        </div>
      </div>
    );
  }

  if (!selectedCalendar) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`opacity-50 cursor-not-allowed ${className}`}
        disabled
      >
        <Calendar className="h-4 w-4 mr-2" />
        Calendar not selected
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`transition-all duration-200 ${className}`}
      onClick={handleButtonClick}
    >
      <Calendar className="h-4 w-4 mr-2" />
      {buttonText}
      <ExternalLink className="h-3 w-3 ml-2 opacity-70" />
    </Button>
  );
};