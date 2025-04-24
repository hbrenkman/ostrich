'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NewTimeEntryDialog } from '@/components/ui/NewTimeEntryDialog';
import { EditTimeEntryDialog } from '@/components/ui/EditTimeEntryDialog';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DragPreviewImage } from 'react-dnd';

const PIXELS_PER_MINUTE = 1;
const MINUTES_PER_DAY = 1440;
const DEFAULT_VIEW_HOURS = 10;
const DEFAULT_VIEW_MINUTES = DEFAULT_VIEW_HOURS * 60;
const DEFAULT_START_HOUR = 8;
const DEFAULT_START_MINUTE = DEFAULT_START_HOUR * 60;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_WIDTH = 150;
const TIME_COLUMN_WIDTH = 80;
const ItemTypes = { ENTRY: 'entry' };

// Mock API (replace with Supabase)
const fetchTimeEntries = async (weekStart) => {
  console.log('Fetching time entries for week:', weekStart);
  return [
    {
      id: '1',
      project: 'Website Redesign',
      task: 'UI Design',
      startTime: '09:17',
      endTime: '10:43',
      date: '2025-04-14', // Monday
    },
    {
      id: '2',
      project: 'Mobile App',
      task: 'API Integration',
      startTime: '14:30',
      endTime: '16:00',
      date: '2025-04-17', // Thursday
    },
  ];
};

// Generate 1-minute slots
const generateTimeSlots = () => {
  const slots = [];
  for (let minute = 0; minute < MINUTES_PER_DAY; minute++) {
    const hours = Math.floor(minute / 60);
    const minutes = minute % 60;
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    slots.push({ time, minute });
  }
  console.log('Generated time slots:', slots.length);
  return slots;
};

// Get the start of the week (Monday) for a given date
const getWeekStart = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Normalize timezone
  const day = d.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = (day === 0 ? 6 : day - 1); // Days to subtract to get to Monday
  d.setDate(d.getDate() - diff);
  const result = d.toISOString().split('T')[0];
  console.log(`getWeekStart called with date=${date}, day=${day}, diff=${diff}, result=${result}`);
  return result;
};

// Get day of month for each day
const getDayOfMonth = (weekStart, dayIndex) => {
  const [year, month, day] = weekStart.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day)); // Parse as UTC date
  date.setUTCDate(day + dayIndex); // Increment date in UTC
  const dayOfMonth = date.getUTCDate(); // Get day in UTC
  console.log(`getDayOfMonth: weekStart=${weekStart}, dayIndex=${dayIndex}, calculatedDate=${date.toISOString()}, dayOfMonth=${dayOfMonth}`);
  return dayOfMonth;
};

// Get days in a month
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

// Mini Calendar Component
const MiniCalendar = ({ year, month, selectedDate, onDateSelect }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar days
  const days = [];
  // Add empty slots for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const isSelected = selectedDate && selectedDate === dateStr;
    days.push(
      <button
        key={day}
        className={cn(
          'h-8 w-8 flex items-center justify-center rounded-full text-sm',
          isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-200',
          date.getDay() === 0 || date.getDay() === 6 ? 'text-gray-500' : 'text-gray-800'
        )}
        onClick={() => onDateSelect(dateStr)}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="w-56 p-2 bg-white border rounded shadow">
      <div className="text-center font-semibold mb-2">
        {monthNames[month]} {year}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        <div>S</div>
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
        {days}
      </div>
    </div>
  );
};

// Mini Calendar with Navigation
const NavigableMiniCalendar = ({ year, month, selectedDate, onDateSelect, onMonthChange }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    onMonthChange(newDate.getFullYear(), newDate.getMonth());
  };

  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    onMonthChange(newDate.getFullYear(), newDate.getMonth());
  };

  // Generate calendar days
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const isSelected = selectedDate && selectedDate === dateStr;
    days.push(
      <button
        key={day}
        className={cn(
          'h-8 w-8 flex items-center justify-center rounded-full text-sm',
          isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-200',
          date.getDay() === 0 || date.getDay() === 6 ? 'text-gray-500' : 'text-gray-800'
        )}
        onClick={() => onDateSelect(dateStr)}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="w-56 p-2 bg-white border rounded shadow">
      <div className="flex items-center justify-between mb-2">
        <button onClick={handlePrevMonth} className="p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center font-semibold">
          {monthNames[month]} {year}
        </div>
        <button onClick={handleNextMonth} className="p-1">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        <div>S</div>
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
        {days}
      </div>
    </div>
  );
};

// Draggable Entry Component
const DraggableEntry = ({ entry, dayIndex, getEntryStyle, onMove, onResize, onEdit }) => {
  console.log(`Rendering entry ${entry.id} for day ${dayIndex}`);
  const style = getEntryStyle(entry, dayIndex);
  if (!style) {
    console.log(`No style for entry ${entry.id} on day ${dayIndex}`);
    return null;
  }

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.ENTRY,
    item: { id: entry.id, startMinute: style.top / PIXELS_PER_MINUTE, dayIndex },
    collect: (monitor) => {
      console.log(`Dragging entry ${entry.id}: isDragging=${monitor.isDragging()}, position=${style.top}px`);
      return { isDragging: monitor.isDragging() };
    },
  });

  const handleResize = (e, edge) => {
    e.stopPropagation();
    let startY = e.clientY;
    let startMinute = style.top / PIXELS_PER_MINUTE;
    let endMinute = (style.top + style.height) / PIXELS_PER_MINUTE;

    const onMouseMove = (moveE) => {
      const deltaY = moveE.clientY - startY;
      if (edge === 'top') {
        startMinute = Math.round(startMinute + deltaY / PIXELS_PER_MINUTE);
      } else {
        endMinute = Math.round(endMinute + deltaY / PIXELS_PER_MINUTE);
      }
      if (startMinute < endMinute && startMinute >= 0 && endMinute <= MINUTES_PER_DAY) {
        onResize(entry.id, startMinute, endMinute);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <>
      <DragPreviewImage connect={preview} src="/drag-preview.png" />
      <div
        ref={drag}
        className={cn(
          'absolute bg-blue-100 text-blue-800 text-xs p-1 rounded cursor-move select-none pointer-events-auto',
          isDragging && 'opacity-50'
        )}
        style={{ ...style, zIndex: 10 }}
        onClick={(e) => {
          e.stopPropagation();
          onEdit(entry);
        }}
        data-testid={`entry-${entry.id}`}
      >
        <div className="w-full h-full pointer-events-none">
          <div
            className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize bg-blue-200 hover:bg-blue-300 pointer-events-auto"
            onMouseDown={(e) => handleResize(e, 'top')}
            onDragStart={(e) => e.preventDefault()}
            data-testid={`resize-top-${entry.id}`}
          />
          <div className="font-semibold" onDragStart={(e) => e.preventDefault()} data-testid={`project-${entry.id}`}>
            {entry.project}
          </div>
          <div onDragStart={(e) => e.preventDefault()} data-testid={`task-${entry.id}`}>
            {entry.task}
          </div>
          <div onDragStart={(e) => e.preventDefault()} data-testid={`time-${entry.id}`}>
            {entry.startTime}–{entry.endTime}
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-blue-200 hover:bg-blue-300 pointer-events-auto"
            onMouseDown={(e) => handleResize(e, 'bottom')}
            onDragStart={(e) => e.preventDefault()}
            data-testid={`resize-bottom-${entry.id}`}
          />
        </div>
      </div>
    </>
  );
};

function TimesheetCalendarContent() {
  const currentDate = new Date('2025-04-19'); // System clock date
  const [weekStart, setWeekStart] = useState(() => {
    const initialWeekStart = getWeekStart(currentDate);
    console.log(`Initial weekStart set to ${initialWeekStart}`);
    return initialWeekStart;
  }); // Default to current week
  const [timeEntries, setTimeEntries] = useState([]);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const timeSlots = generateTimeSlots();
  const scrollRef = useRef(null);
  const calendarRef = useRef(null);

  // Calculate previous month and year
  const getPreviousMonth = () => {
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    return { month: prevDate.getMonth(), year: prevDate.getFullYear() };
  };

  const { month: prevMonth, year: prevYear } = getPreviousMonth();

  useEffect(() => {
    console.log(`Fetching entries with weekStart=${weekStart}`);
    fetchTimeEntries(weekStart).then((entries) => {
      setTimeEntries(entries);
      console.log('Fetched time entries:', JSON.stringify(entries, null, 2));
    });
  }, [weekStart]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = DEFAULT_START_MINUTE * PIXELS_PER_MINUTE;
      console.log('Scrolled to 8:00 AM:', DEFAULT_START_MINUTE);
    }
  }, []);

  const getEntryStyle = (entry, dayIndex) => {
    const [startHours, startMinutes] = entry.startTime.split(':').map(Number);
    const [endHours, endMinutes] = entry.endTime.split(':').map(Number);
    const startMinute = startHours * 60 + startMinutes;
    const endMinute = endHours * 60 + endMinutes;
    const duration = endMinute - startMinute;
    if (duration <= 0) {
      console.warn(`Invalid duration for entry ${entry.id}: ${duration} minutes`);
      return null;
    }

    const adjustedLeft = 0; // Position at the start of the day-column
    const adjustedWidth = DAY_WIDTH - 8; // Subtract 8px for padding (4px on each side)

    const style = {
      top: startMinute * PIXELS_PER_MINUTE,
      height: duration * PIXELS_PER_MINUTE,
      left: adjustedLeft,
      width: adjustedWidth,
    };
    console.log(`Entry ${entry.id} style for day ${dayIndex}:`, {
      project: entry.project,
      time: `${entry.startTime}–${entry.endTime}`,
      duration,
      height: style.height,
      top: style.top,
      left: style.left,
      width: style.width,
      alignedWith: timeSlots.find((slot) => slot.minute === startMinute)?.time,
    });
    return style;
  };

  const handleAddEntry = (dayIndex, minute) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    const hours = Math.floor(minute / 60);
    const minutes = minute % 60;
    const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setSelectedEntry({
      id: '',
      project: '',
      task: '',
      startTime,
      endTime: startTime,
      date: date.toISOString().split('T')[0],
    });
    setIsNewDialogOpen(true);
    console.log('Opening new entry dialog:', { dayIndex, minute, startTime });
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setIsEditDialogOpen(true);
    console.log('Opening edit entry dialog:', entry);
  };

  const handleSaveEntry = (entry) => {
    setTimeEntries((prev) => {
      let newEntries;
      if (entry.id && prev.some((e) => e.id === entry.id)) {
        newEntries = prev.map((e) => (e.id === entry.id ? { ...entry } : e));
      } else {
        newEntries = [...prev, { ...entry, id: entry.id || `${Date.now()}` }];
      }
      console.log('Saved entry:', entry, 'Updated timeEntries:', JSON.stringify(newEntries, null, 2));
      return newEntries;
    });
    setIsNewDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedEntry(null);
  };

  const handleMoveEntry = (id, newStartMinute, newDayIndex) => {
    console.log(`handleMoveEntry called: id=${id}, newStartMinute=${newStartMinute}, newDayIndex=${newDayIndex}`);
    if (newStartMinute < 0 || newStartMinute >= MINUTES_PER_DAY || newDayIndex < 0 || newDayIndex >= DAYS.length) {
      console.warn(`Invalid move for entry ${id}: minute=${newStartMinute}, day=${newDayIndex}`);
      return;
    }
    newStartMinute = Math.round(newStartMinute);
    const date = new Date(weekStart);
    date.setDate(date.getDate() + newDayIndex);
    const hours = Math.floor(newStartMinute / 60);
    const minutes = newStartMinute % 60;
    const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setTimeEntries((prevEntries) => {
      const newEntries = prevEntries.map((entry) => {
        if (entry.id !== id) return { ...entry };
        const [startHours, startMinutes] = entry.startTime.split(':').map(Number);
        const [endHours, endMinutes] = entry.endTime.split(':').map(Number);
        const duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        let newEndMinute = newStartMinute + duration;
        if (newEndMinute > MINUTES_PER_DAY) {
          console.warn(`End time would exceed day for entry ${id}: ${newEndMinute}. Capping at 23:59.`);
          newEndMinute = MINUTES_PER_DAY - 1;
        }
        const newEndHours = Math.floor(newEndMinute / 60);
        const newEndMinutes = newEndMinute % 60;
        const newEndTime = `${newEndHours.toString().padStart(2, '0')}:${newEndMinutes.toString().padStart(2, '0')}`;
        const updatedEntry = {
          ...entry,
          startTime: newStartTime,
          endTime: newEndTime,
          date: date.toISOString().split('T')[0],
        };
        console.log(
          `Moved entry ${id} to ${newStartTime}–${newEndTime} on day ${newDayIndex} (${date.toISOString().split('T')[0]})`
        );
        return updatedEntry;
      });
      console.log('Updated timeEntries:', JSON.stringify(newEntries, null, 2));
      return [...newEntries];
    });
  };

  const handleResizeEntry = (id, newStartMinute, newEndMinute) => {
    console.log(`handleResizeEntry called: id=${id}, newStartMinute=${newStartMinute}, newEndMinute=${newEndMinute}`);
    if (newStartMinute < 0 || newEndMinute > MINUTES_PER_DAY || newStartMinute >= newEndMinute) {
      console.warn(`Invalid resize for entry ${id}: start=${newStartMinute}, end=${newEndMinute}`);
      return;
    }
    const hoursStart = Math.floor(newStartMinute / 60);
    const minutesStart = newStartMinute % 60;
    const hoursEnd = Math.floor(newEndMinute / 60);
    const minutesEnd = newEndMinute % 60;
    const newStartTime = `${hoursStart.toString().padStart(2, '0')}:${minutesStart.toString().padStart(2, '0')}`;
    const newEndTime = `${hoursEnd.toString().padStart(2, '0')}:${minutesEnd.toString().padStart(2, '0')}`;
    setTimeEntries((prevEntries) => {
      const newEntries = prevEntries.map((entry) => {
        if (entry.id !== id) return { ...entry };
        console.log(`Resized entry ${id} to ${newStartTime}–${newEndTime}`);
        return {
          ...entry,
          startTime: newStartTime,
          endTime: newEndTime,
        };
      });
      console.log('Updated timeEntries:', JSON.stringify(newEntries, null, 2));
      return [...newEntries];
    });
  };

  const handleDateSelect = (dateStr) => {
    console.log(`handleDateSelect called with dateStr=${dateStr}`);
    const newWeekStart = getWeekStart(dateStr);
    setWeekStart(newWeekStart);
  };

  const handleMonthChange = (newYear, newMonth) => {
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
  };

  console.log('Rendering TimesheetCalendarContent');
  return (
    <div className="page-container bg-background flex">
      {/* Mini Calendars */}
      <div className="flex flex-col gap-4 p-4">
        <NavigableMiniCalendar
          year={prevYear}
          month={prevMonth}
          selectedDate={weekStart}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          className="dark:bg-[#374151] dark:text-[#E5E7EB]"
        />
        <MiniCalendar
          year={currentYear}
          month={currentMonth}
          selectedDate={weekStart}
          onDateSelect={handleDateSelect}
          className="dark:bg-[#374151] dark:text-[#E5E7EB]"
        />
      </div>

      {/* Main Calendar */}
      <div className="flex-1">
        <div className="page-header p-4 bg-background border-b sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link href="/" className="back-button">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="page-title">Timesheet Calendar</h1>
          </div>
          <Button onClick={() => handleAddEntry(0, DEFAULT_START_MINUTE)} data-testid="add-entry-button">
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>

        <div className="flex-1 p-4" ref={calendarRef}>
          <div className="flex sticky top-0 bg-background z-10 border-b">
            <div className="w-[80px]" />
            {DAYS.map((day, dayIndex) => (
              <div
                key={day}
                className="text-center font-semibold text-foreground border-b border-r py-2 box-border"
                style={{ width: DAY_WIDTH, minWidth: DAY_WIDTH }}
              >
                {day} {getDayOfMonth(weekStart, dayIndex)}
              </div>
            ))}
          </div>
          <div
            ref={scrollRef}
            className="relative overflow-y-auto"
            style={{ height: DEFAULT_VIEW_MINUTES * PIXELS_PER_MINUTE }}
          >
            <div className="flex" style={{ height: MINUTES_PER_DAY * PIXELS_PER_MINUTE, position: 'relative' }}>
              <div className="w-[80px] sticky left-0 bg-background z-10">
                {timeSlots
                  .filter((slot) => slot.minute % 30 === 0)
                  .map((slot) => (
                    <div
                      key={slot.time}
                      className="text-foreground text-xs flex items-center px-2 border-b"
                      style={{
                        height: 30 * PIXELS_PER_MINUTE,
                        position: 'absolute',
                        top: slot.minute * PIXELS_PER_MINUTE,
                        width: '100%',
                      }}
                    >
                      {slot.time}
                    </div>
                  ))}
              </div>
              {DAYS.map((day, dayIndex) => {
                console.log(`Setting up drop target for day ${day} (index: ${dayIndex})`);
                const [{ isOver }, drop] = useDrop({
                  accept: ItemTypes.ENTRY,
                  drop: (item, monitor) => {
                    console.log(`Drop initiated for entry ${item.id} on day ${dayIndex}`);
                    const delta = monitor.getDifferenceFromInitialOffset();
                    const sourceOffset = monitor.getSourceClientOffset();
                    if (!delta || !sourceOffset || !calendarRef.current) {
                      console.warn(`Invalid drop for entry ${item.id}: delta or sourceOffset missing`);
                      return;
                    }
                    const calendarRect = calendarRef.current.getBoundingClientRect();
                    const newStartMinute = Math.round(item.startMinute + delta.y / PIXELS_PER_MINUTE);
                    const x = sourceOffset.x - calendarRect.left - TIME_COLUMN_WIDTH;
                    const newDayIndex = Math.min(Math.max(0, Math.floor(x / DAY_WIDTH)), DAYS.length - 1);
                    console.log(
                      `Dropped entry ${item.id} at minute=${newStartMinute}, day=${newDayIndex}, x=${x}, deltaY=${
                        delta.y
                      }, sourceOffset=${JSON.stringify(sourceOffset)}, calendarLeft=${calendarRect.left}`
                    );
                    handleMoveEntry(item.id, newStartMinute, newDayIndex);
                  },
                  collect: (monitor) => {
                    console.log(`Collecting for day ${dayIndex}: isOver=${monitor.isOver()}`);
                    return { isOver: monitor.isOver() };
                  },
                });

                // Filter entries that belong to this day
                const entriesForDay = timeEntries.filter((entry) => {
                  const entryDate = new Date(entry.date);
                  const weekStartDate = new Date(weekStart);
                  entryDate.setHours(0, 0, 0, 0);
                  weekStartDate.setHours(0, 0, 0, 0);
                  const dayOffset = Math.floor((entryDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
                  console.log(`Entry ${entry.id} on ${entry.date}, weekStart=${weekStart}, dayOffset=${dayOffset}, dayIndex=${dayIndex}`);
                  return dayOffset === dayIndex;
                });
                console.log(`Entries for day ${dayIndex} (${day} ${getDayOfMonth(weekStart, dayIndex)}):`, entriesForDay.map(e => e.project));

                return (
                  <div
                    key={day}
                    ref={drop}
                    className={cn('relative border-r box-border', isOver && 'bg-gray-100')}
                    style={{ width: DAY_WIDTH, minWidth: DAY_WIDTH }}
                    onClick={() => handleAddEntry(dayIndex, DEFAULT_START_MINUTE)}
                    data-testid={`day-column-${dayIndex}`}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 bg-gray-200 dark:bg-gray-700"
                      style={{ height: DEFAULT_START_MINUTE * PIXELS_PER_MINUTE }}
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gray-200 dark:bg-gray-700"
                      style={{
                        height: (MINUTES_PER_DAY - (DEFAULT_START_MINUTE + DEFAULT_VIEW_MINUTES)) * PIXELS_PER_MINUTE,
                      }}
                    />
                    {entriesForDay.map((entry) => (
                      <DraggableEntry
                        key={entry.id}
                        entry={entry}
                        dayIndex={dayIndex}
                        getEntryStyle={getEntryStyle}
                        onMove={handleMoveEntry}
                        onResize={handleResizeEntry}
                        onEdit={handleEditEntry}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {isNewDialogOpen && selectedEntry && (
          <NewTimeEntryDialog
            open={isNewDialogOpen}
            onOpenChange={setIsNewDialogOpen}
            onSave={handleSaveEntry}
            initialEntry={selectedEntry}
          />
        )}
        {isEditDialogOpen && selectedEntry && (
          <EditTimeEntryDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSave={handleSaveEntry}
            entry={selectedEntry}
          />
        )}
      </div>
    </div>
  );
}

export default function TimesheetCalendar() {
  return (
    <DndProvider backend={HTML5Backend}>
      <TimesheetCalendarContent />
    </DndProvider>
  );
}