import React, { useState, useEffect } from 'react';
import { Task, List, Habit, Priority } from '../types';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, 
  format, isSameMonth, isSameDay, addMonths, subMonths, getDay, isBefore, 
  isAfter, startOfDay 
} from 'date-fns';
import { 
  Menu, ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, Circle, 
  Clock, Target, MapPin, Calendar as CalendarIcon 
} from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  lists: List[];
  habits: Habit[];
  accessToken: string | null;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onMenuClick: () => void;
  onConnectGCal: () => void;
  onTokenExpired: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  lists,
  habits,
  accessToken,
  onToggleTask,
  onSelectTask,
  onMenuClick,
  onConnectGCal
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getHabitsForDay = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const d = startOfDay(date);
      
      return habits.filter(h => {
          if (h.isArchived) return false;
          
          const start = h.startDate ? startOfDay(new Date(h.startDate)) : null;
          const end = h.endDate ? startOfDay(new Date(h.endDate)) : null;
          
          if (start && isBefore(d, start)) return false;
          if (end && isAfter(d, end)) return false;

          // If explicitly completed
          if (h.history[dateStr]?.completed) return true;

          // If Daily schedule matches
          if (h.frequencyType === 'daily') {
              const dayOfWeek = getDay(date); // 0=Sun
              return h.frequencyDays?.includes(dayOfWeek);
          }
          
          // For Weekly (flexible count), we generally show them in the list to be done,
          // but avoiding clutter in the grid unless completed might be preferred.
          // However, to ensure they "reflect as weekly", we can include them if needed.
          // For now, sticking to specific-day logic for grid clarity, or completed.
          if (h.frequencyType === 'weekly') {
             // Optional: Return true if you want flexible habits to appear every day in grid
             // return true; 
             return false;
          }

          return false;
      });
  };

  const getTasksForDay = (date: Date) => {
      return tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date) && !t.isDeleted);
  };

  const selectedDayTasks = getTasksForDay(selectedDate);
  const selectedDayHabits = getHabitsForDay(selectedDate);

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.High: return 'text-red-500';
      case Priority.Medium: return 'text-yellow-500';
      case Priority.Low: return 'text-blue-500';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Calendar Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-3">
            <button onClick={onMenuClick} className="md:hidden text-slate-500 hover:bg-slate-100 p-2 rounded-md"><Menu size={20}/></button>
            <h1 className="text-xl font-bold text-slate-800">{format(currentMonthDate, 'MMMM yyyy')}</h1>
            <div className="flex items-center gap-1 ml-4 bg-slate-100 rounded-lg p-1">
                <button onClick={() => setCurrentMonthDate(subMonths(currentMonthDate, 1))} className="p-1 hover:bg-white rounded shadow-sm transition-colors"><ChevronLeft size={16}/></button>
                <button onClick={() => setCurrentMonthDate(addMonths(currentMonthDate, 1))} className="p-1 hover:bg-white rounded shadow-sm transition-colors"><ChevronRight size={16}/></button>
            </div>
         </div>
         <div className="flex gap-2">
             <button onClick={() => { const now = new Date(); setCurrentMonthDate(now); setSelectedDate(now); }} className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                 Today
             </button>
             {!accessToken && (
                 <button onClick={onConnectGCal} className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors">
                     <RefreshCw size={12}/> Sync
                 </button>
             )}
         </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 shrink-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>
          ))}
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-white gap-px border-b border-slate-200 overflow-y-auto custom-scrollbar" style={{ maxHeight: '50%' }}>
          {days.map(day => {
              const dayTasks = getTasksForDay(day);
              const dayHabits = getHabitsForDay(day);
              
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);

              return (
                  <div 
                    key={day.toString()} 
                    onClick={() => setSelectedDate(day)}
                    className={`
                        flex flex-col p-1 min-h-[80px] cursor-pointer transition-colors border-r border-b border-slate-50
                        ${isSelected ? 'bg-blue-50' : isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50'}
                    `}
                  >
                      <div className="flex justify-center mb-1">
                          <div className={`
                              text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                              ${isSelected ? 'bg-blue-600 text-white shadow-md' : isToday ? 'bg-blue-100 text-blue-600' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}
                          `}>
                              {format(day, 'd')}
                          </div>
                      </div>
                      
                      {/* Compact Indicators for Grid */}
                      <div className="space-y-0.5 overflow-hidden px-0.5">
                          {dayTasks.slice(0, 3).map(t => (
                              <div key={t.id} className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${t.isCompleted ? 'text-slate-400 line-through bg-slate-100' : 'text-slate-700 bg-blue-50 border-l-2 border-blue-400'}`}>
                                  {t.title}
                              </div>
                          ))}
                          {dayHabits.slice(0, 2).map(h => (
                              <div key={h.id} className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate bg-emerald-50 text-emerald-700" style={{ backgroundColor: `${h.color}15`, color: h.color }}>
                                  {h.name}
                              </div>
                          ))}
                          {(dayTasks.length + dayHabits.length) > 5 && (
                              <div className="text-[9px] font-bold text-slate-400 pl-1">+{(dayTasks.length + dayHabits.length) - 5} more</div>
                          )}
                      </div>
                  </div>
              );
          })}
      </div>

      {/* Selected Day List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 flex flex-col">
          <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 z-10 flex justify-between items-center shadow-sm">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-blue-500" />
                  {format(selectedDate, 'EEEE, MMMM do')}
              </h2>
              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                  {selectedDayTasks.length + selectedDayHabits.length} Items
              </span>
          </div>

          <div className="p-4 space-y-4">
              {/* Tasks Section */}
              {selectedDayTasks.length > 0 && (
                  <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">Tasks</h3>
                      {selectedDayTasks.map(task => (
                          <div 
                            key={task.id}
                            onClick={() => onSelectTask(task.id)}
                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 hover:shadow-md transition-all cursor-pointer group"
                          >
                              <button 
                                  onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                                  className={`mt-0.5 ${getPriorityColor(task.priority)}`}
                              >
                                  {task.isCompleted ? <CheckCircle2 size={20} className="text-slate-300" /> : <Circle size={20} />}
                              </button>
                              <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                      {task.title}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1.5">
                                      {!task.isAllDay && (
                                          <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                              <Clock size={10} /> {format(new Date(task.dueDate!), 'HH:mm')}
                                          </div>
                                      )}
                                      {task.listId !== 'inbox' && (
                                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lists.find(l => l.id === task.listId)?.color || '#ccc' }} />
                                              {lists.find(l => l.id === task.listId)?.name}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {/* Habits Section */}
              {selectedDayHabits.length > 0 && (
                  <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">Habits</h3>
                      {selectedDayHabits.map(habit => {
                          const dateStr = format(selectedDate, 'yyyy-MM-dd');
                          const isCompleted = habit.history[dateStr]?.completed;
                          
                          return (
                              <div 
                                key={habit.id}
                                className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all"
                              >
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-slate-50 text-slate-600">
                                          {habit.icon}
                                      </div>
                                      <div>
                                          <div className="text-sm font-bold text-slate-800">{habit.name}</div>
                                          <div className="text-[10px] text-slate-400 font-medium">
                                              {habit.quote || "Daily Goal"}
                                          </div>
                                      </div>
                                  </div>
                                  {isCompleted ? (
                                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
                                          <CheckCircle2 size={14} /> Done
                                      </div>
                                  ) : (
                                      <div className="text-slate-400 text-xs font-medium bg-slate-50 px-2 py-1 rounded-lg">
                                          Pending
                                      </div>
                                  )}
                              </div>
                          )
                      })}
                  </div>
              )}

              {selectedDayTasks.length === 0 && selectedDayHabits.length === 0 && (
                  <div className="text-center py-10 flex flex-col items-center opacity-50">
                      <Target size={40} className="text-slate-300 mb-2" strokeWidth={1.5} />
                      <p className="text-slate-400 text-sm">No tasks or habits for this day.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default CalendarView;