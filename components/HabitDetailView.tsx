import React, { useState } from 'react';
import { Habit } from '../types';
import { 
  X, Calendar as CalendarIcon, MoreVertical, Edit2, Trash2, 
  ChevronLeft, ChevronRight, CheckCircle2, Trophy, Flame, CalendarDays
} from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, subMonths, 
  differenceInDays, parseISO 
} from 'date-fns';
import HabitFormSheet from './HabitFormSheet';

interface HabitDetailViewProps {
  habit: Habit;
  onClose: () => void;
  onToggleCheck: (dateStr: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

const HabitDetailView: React.FC<HabitDetailViewProps> = ({ 
    habit, onClose, onToggleCheck, onEdit, onDelete 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const calculateStats = () => {
      // Simple streak calculation
      const dates = Object.keys(habit.history)
          .filter(d => habit.history[d].completed)
          .sort()
          .map(d => parseISO(d));
      
      let currentStreak = 0;
      let totalDays = dates.length;

      if (dates.length > 0) {
          // Calculate current streak
          const today = new Date();
          const todayStr = format(today, 'yyyy-MM-dd');
          
          let d = new Date();
          let streak = 0;
          
          // Check if today is completed or not checked yet (allow 1 day gap if today not checked?)
          // For simple logic: count backwards from today or yesterday
          
          // If not done today, start checking from yesterday
          if (!habit.history[todayStr]?.completed) {
              d.setDate(d.getDate() - 1);
          }
          
          while (true) {
              const dStr = format(d, 'yyyy-MM-dd');
              if (habit.history[dStr]?.completed) {
                  streak++;
                  d.setDate(d.getDate() - 1);
              } else {
                  break;
              }
          }
          currentStreak = streak;
      }

      return { currentStreak, totalDays };
  };

  const { currentStreak, totalDays } = calculateStats();

  const renderCalendar = () => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      // Pad start
      const startDay = monthStart.getDay(); // 0 is Sunday
      const padding = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }).map((_, i) => i); // Mon start

      return (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-slate-800">{format(currentMonth, 'MMMM yyyy')}</span>
                  <div className="flex gap-1">
                      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronLeft size={20}/></button>
                      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronRight size={20}/></button>
                  </div>
              </div>
              <div className="grid grid-cols-7 text-center mb-2">
                  {['M','T','W','T','F','S','S'].map(d => (
                      <div key={d} className="text-xs font-bold text-slate-300 py-1">{d}</div>
                  ))}
              </div>
              <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                  {padding.map(i => <div key={`pad-${i}`} />)}
                  {days.map((day, idx) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isCompleted = habit.history[dateStr]?.completed;
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                          <button
                              key={dateStr}
                              onClick={() => onToggleCheck(dateStr)}
                              className={`
                                  aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all relative
                                  ${isCompleted ? 'text-white' : isToday ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-50'}
                              `}
                              style={{ backgroundColor: isCompleted ? habit.color : undefined }}
                          >
                              {format(day, 'd')}
                              {isToday && !isCompleted && <div className="absolute bottom-1 w-1 h-1 bg-slate-400 rounded-full"/>}
                          </button>
                      );
                  })}
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 bg-white border-b border-slate-100 shrink-0">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full">
              <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${habit.color}20` }}>
                  {habit.icon}
              </div>
              <span className="font-bold text-slate-800">{habit.name}</span>
          </div>
          <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 -mr-2 text-slate-500 hover:bg-slate-50 rounded-full">
                  <MoreVertical size={24} />
              </button>
              {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}/>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 animate-in zoom-in-95">
                        <button 
                            onClick={() => { setIsEditing(true); setShowMenu(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-3"
                        >
                            <Edit2 size={16} /> Edit Habit
                        </button>
                        <button 
                            onClick={() => { onDelete(habit.id); onClose(); }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-red-600 flex items-center gap-3"
                        >
                            <Trash2 size={16} /> Delete Habit
                        </button>
                    </div>
                  </>
              )}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                      <Flame size={20} fill="currentColor" />
                  </div>
                  <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">{currentStreak}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Current Streak</div>
                  </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                      <Trophy size={20} fill="currentColor" />
                  </div>
                  <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">{totalDays}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Days</div>
                  </div>
              </div>
          </div>

          {/* Calendar */}
          <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CalendarDays size={18} className="text-slate-400"/> History
              </h3>
              {renderCalendar()}
          </div>

          {/* Quote */}
          {habit.quote && (
              <div className="bg-slate-100/50 p-6 rounded-2xl text-center">
                  <p className="text-slate-500 italic font-medium">"{habit.quote}"</p>
              </div>
          )}
      </div>

      <HabitFormSheet 
          isOpen={isEditing} 
          onClose={() => setIsEditing(false)}
          onSave={(updated) => { onEdit(updated); setIsEditing(false); }}
          initialData={habit}
      />
    </div>
  );
};

export default HabitDetailView;