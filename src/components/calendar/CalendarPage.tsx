import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { EventModal } from './EventModal';

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

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete'>('create');
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, currentDate]);

  const fetchEvents = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const openModal = (mode: 'create' | 'edit' | 'delete' = 'create', event?: CalendarEvent, date?: Date) => {
    setModalMode(mode);
    setSelectedEvent(event);
    setSelectedDate(date || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(undefined);
    setSelectedDate(null);
    setModalMode('create');
  };

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedEvent) return;

    // Calculate target hour from mouse position for week/day views
    let targetHour = new Date(draggedEvent.start_time).getHours();
    
    if (view === 'week' || view === 'day') {
      // Find the day container
      const dayContainer = e.currentTarget as HTMLElement;
      const rect = dayContainer.getBoundingClientRect();
      const y = e.clientY - rect.top;
      
      // Find the time column offset (first column in week view)
      let timeColumnOffset = 0;
      if (view === 'week') {
        const timeColumn = dayContainer.parentElement?.querySelector('.border-r') as HTMLElement;
        if (timeColumn) {
          timeColumnOffset = timeColumn.offsetHeight > 0 ? 0 : 0; // Time column is separate
        }
      }
      
      targetHour = Math.floor((y - timeColumnOffset) / 64); // 64px per hour
      targetHour = Math.max(0, Math.min(23, targetHour));
    }

    // Calculate time difference
    const originalStart = new Date(draggedEvent.start_time);
    const originalEnd = new Date(draggedEvent.end_time);
    const timeDiff = originalEnd.getTime() - originalStart.getTime();
    
    // Set new times
    const newStart = new Date(targetDate);
    newStart.setHours(targetHour, 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + timeDiff);

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString()
        })
        .eq('id', draggedEvent.id);

      if (error) throw error;
      fetchEvents();
    } catch (error) {
      console.error('Error moving event:', error);
    }

    setDraggedEvent(null);
  };

  const createEventAtHour = (date: Date, hour: number) => {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    openModal('create', undefined, startTime);
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);

    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
        <div className="grid grid-cols-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="p-4 border-r border-gray-200 font-semibold text-gray-700">Időpont</div>
          {days.map((day) => (
            <div key={day.getTime()} className="p-4 text-center border-r border-gray-200">
              <div className="text-sm font-medium text-gray-600">
                {day.toLocaleDateString('hu-HU', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-bold mt-1 ${
                day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8" style={{ minHeight: '600px' }}>
          {/* Time column */}
          <div className="border-r border-gray-200 bg-gray-50">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-16 border-b border-gray-100 p-2 text-sm text-gray-500 font-medium">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = getEventsForDate(day);
            
            return (
              <div
                key={day.getTime()}
                className="border-r border-gray-200 relative"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <div
                    key={hour}
                    onClick={() => createEventAtHour(day, hour)}
                    className="h-16 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors relative group"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-blue-50 rounded-md m-1 flex items-center justify-center transition-opacity">
                      <Plus className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
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
                      draggable
                      onDragStart={(e) => handleDragStart(e, event)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openModal('edit', event);
                      }}
                      className="absolute left-1 right-1 p-3 rounded-lg text-xs text-white cursor-move transition-all duration-200 hover:shadow-sm hover:scale-[1.02]"
                      style={{
                        backgroundColor: event.color || '#3b82f6',
                        top: `${startHour * 64}px`,
                        height: `${Math.max(duration * 64, 40)}px`,
                        zIndex: 10,
                      }}
                    >
                      <div className="font-semibold truncate mb-1">{event.title}</div>
                      {event.location && (
                        <div className="truncate opacity-90 text-xs">{event.location}</div>
                      )}
                      <div className="text-xs opacity-75 mt-1">
                        {startTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                        {duration >= 1 && ` - ${endTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}`}
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

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          {['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'].map(day => (
            <div key={day} className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-32 p-2 border-r border-b border-gray-100 last:border-r-0 cursor-pointer hover:bg-blue-50 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  setCurrentDate(day);
                  setView('day');
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, event)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openModal('edit', event);
                      }}
                      className="text-xs p-1 rounded truncate text-white cursor-move transition-all hover:opacity-80"
                      style={{ backgroundColor: event.color || '#3b82f6' }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - 3} további
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

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-xl font-bold text-gray-900">
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
          <div className="w-20 border-r border-gray-200 bg-gray-50">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-16 border-b border-gray-100 p-2 text-sm text-gray-500 font-medium">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          
          {/* Day content */}
          <div
            className="flex-1 relative"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, currentDate)}
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                onClick={() => createEventAtHour(currentDate, hour)}
                className="h-16 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors relative group"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-blue-50 rounded-md m-1 flex items-center justify-center transition-opacity">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
              </div>
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
                  draggable
                  onDragStart={(e) => handleDragStart(e, event)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openModal('edit', event);
                  }}
                  className="absolute left-2 right-2 p-3 rounded-lg text-sm text-white cursor-move transition-all duration-200 hover:shadow-sm hover:scale-[1.02]"
                  style={{
                    backgroundColor: event.color || '#3b82f6',
                    top: `${startHour * 64}px`,
                    height: `${Math.max(duration * 64, 40)}px`,
                    zIndex: 10,
                  }}
                >
                  <div className="font-semibold mb-1">{event.title}</div>
                  {event.location && (
                    <div className="text-xs opacity-90 mb-1">{event.location}</div>
                  )}
                  <div className="text-xs opacity-75">
                    {startTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                    {duration >= 1 && ` - ${endTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });
    } else if (view === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return `${weekStart.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Naptár</h1>
              <p className="text-gray-600">Események és találkozók kezelése</p>
            </div>
            <button
              onClick={() => openModal('create')}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Új esemény</span>
            </button>
          </div>

          {/* Navigation and View Controls */}
          <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900 min-w-64 text-center">
                {getDateRangeText()}
              </h2>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                Ma
              </button>
            </div>

            {/* View selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['month', 'week', 'day'] as const).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    view === viewType
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {viewType === 'month' ? 'Hónap' : viewType === 'week' ? 'Hét' : 'Nap'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}

        {/* Event Modal */}
        <EventModal
          key={`${modalMode}-${selectedEvent?.id || 'new'}`}
          isOpen={isModalOpen}
          onClose={closeModal}
          event={selectedEvent}
          selectedDate={selectedDate || undefined}
          mode={modalMode}
          onEventSaved={() => {
            fetchEvents();
            closeModal();
          }}
          onEventDeleted={() => {
            fetchEvents();
            closeModal();
          }}
        />
      </div>
    </div>
  );
};