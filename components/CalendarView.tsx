import React from 'react';
import { Task, List, Habit } from '../types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Menu, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

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
  accessToken,
  onSelectTask,
  onMenuClick,
  onConnectGCal
}) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={onMenuClick} className="md:hidden text-slate-500"><Menu size={20}/></button>
            <h1 className="text-xl font-bold text-slate-800">{format(currentDate, 'MMMM yyyy')}</h1>
            <div className="flex items-center gap-1 ml-4 bg-slate-100 rounded-lg p-1">
                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-white rounded shadow-sm"><ChevronLeft size={16}/></button>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-white rounded shadow-sm"><ChevronRight size={16}/></button>
            </div>
         </div>
         {!accessToken && (
             <button onClick={onConnectGCal} className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-bold hover:bg-blue-100">
                 <RefreshCw size={12}/> Sync Google Calendar
             </button>
         )}
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase">{d}</div>
          ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6">
          {days.map(day => {
              const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day) && !t.isDeleted);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                  <div 
                    key={day.toString()} 
                    className={`border-b border-r border-slate-100 p-1 md:p-2 min-h-[80px] overflow-hidden ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                      <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                          {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                          {dayTasks.map(t => (
                              <div 
                                key={t.id} 
                                onClick={() => onSelectTask(t.id)}
                                className={`
                                    text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer
                                    ${t.isCompleted ? 'bg-slate-100 text-slate-400 line-through' : 'bg-blue-50 text-blue-700 font-medium'}
                                `}
                              >
                                  {t.title}
                              </div>
                          ))}
                      </div>
                  </div>
              );
          })}
      </div>
    </div>
  );
};

export default CalendarView;