import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  color: string | null;
}

type ViewType = 'month' | 'week' | 'day';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, currentDate]);

  const fetchEvents = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', startOfMonth.toISOString())
        .lte('end_time', endOfMonth.toISOString())
        .order('start_time');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
    };
    
    if (view === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' })} ${currentDate.getFullYear()}`;
    } else if (view === 'day') {
      return currentDate.toLocaleDateString('hu-HU', { ...options, day: 'numeric', weekday: 'long' });
    }
    
    return currentDate.toLocaleDateString('hu-HU', options);
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    
    // Adjust to start from Monday
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - mondayOffset);
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return eventDate.getTime() === checkDate.getTime();
    });
  };

  const renderMonthView = () => {
    const days = getDaysInMonth();
    const today = new Date();
    const currentMonth = currentDate.getMonth();

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = day.toDateString() === today.toDateString();
            const dayEvents = getEventsForDate(day);

            return (
              <div
                key={index}
                className={`min-h-32 border-r border-b border-gray-100 p-2 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } hover:bg-gray-50 cursor-pointer transition-colors`}
                onClick={() => {
                  setCurrentDate(new Date(day));
                  setView('day');
                }}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded truncate"
                      style={{ backgroundColor: (event.color || '#3b82f6') + '20', color: event.color || '#3b82f6' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add event modal logic here
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - 3} több
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = getWeekStart(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-4 border-r border-gray-200"></div>
          {days.map((day) => (
            <div key={day.getTime()} className="p-4 text-center border-r border-gray-200">
              <div className="text-sm font-medium text-gray-900">
                {day.toLocaleDateString('hu-HU', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-semibold ${
                day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8" style={{ minHeight: '600px' }}>
          {/* Time column */}
          <div className="border-r border-gray-200">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-16 border-b border-gray-100 p-2 text-xs text-gray-500">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = getEventsForDate(day);
            return (
              <div key={day.getTime()} className="border-r border-gray-200 relative">
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="h-16 border-b border-gray-100"></div>
                ))}
                
                {/* Events */}
                {dayEvents.map((event) => {
                  const startTime = new Date(event.start_time);
                  const endTime = new Date(event.end_time);
                  const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                  
                  return (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 rounded text-xs p-1 cursor-pointer"
                      style={{
                        top: `${startHour * 4}rem`,
                        height: `${Math.max(duration * 4, 1)}rem`,
                        backgroundColor: (event.color || '#3b82f6') + '20',
                        borderLeft: `3px solid ${event.color || '#3b82f6'}`,
                      }}
                      onClick={() => {
                        // Add event modal logic here
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-gray-600">
                        {startTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentDate.toLocaleDateString('hu-HU', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>

        <div className="flex">
          {/* Time column */}
          <div className="w-20 border-r border-gray-200">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-16 border-b border-gray-100 p-2 text-xs text-gray-500">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="flex-1 relative">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-16 border-b border-gray-100"></div>
            ))}

            {dayEvents.map((event) => {
              const startTime = new Date(event.start_time);
              const endTime = new Date(event.end_time);
              const startHour = startTime.getHours() + startTime.getMinutes() / 60;
              const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

              return (
                <div
                  key={event.id}
                  className="absolute left-2 right-2 rounded p-2 cursor-pointer"
                  style={{
                    top: `${startHour * 4}rem`,
                    height: `${Math.max(duration * 4, 2)}rem`,
                    backgroundColor: (event.color || '#3b82f6') + '20',
                    borderLeft: `4px solid ${event.color || '#3b82f6'}`,
                  }}
                  onClick={() => {
                    // Add event modal logic here
                  }}
                >
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {startTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })} - 
                    {endTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {event.location && (
                    <div className="text-xs text-gray-600 mt-1 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {event.location}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Naptár</h1>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <h2 className="text-lg font-semibold text-gray-900 min-w-64 text-center">
                {formatDateHeader()}
              </h2>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View switcher */}
            <div className="flex rounded-lg border border-gray-200 p-1">
              {(['month', 'week', 'day'] as ViewType[]).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    view === viewType
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {viewType === 'month' ? 'Hónap' : viewType === 'week' ? 'Hét' : 'Nap'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ma
            </button>

            <button
            onClick={() => {
              setCurrentDate(new Date());
              // Create new event
            }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Új esemény</span>
            </button>
          </div>
        </div>

        {/* Calendar View */}
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
    </div>
  );
};