import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { 
  Plus, Settings, Check, Clock, BookOpen, Sliders, Menu, ChevronRight, PieChart
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, subDays } from 'date-fns';
import HabitDetailView from './HabitDetailView';
import HabitFormSheet from './HabitFormSheet';

interface HabitViewProps {
  habits: Habit[];
  onToggleHabit: (habitId: string, dateStr: string) => void;
  onUpdateHabit: (habit: Habit) => void;
  onAddHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onMenuClick?: () => void;
  onOpenStats?: () => void;
}

const HabitView: React.FC<HabitViewProps> = ({ habits, onToggleHabit, onUpdateHabit, onAddHabit, onDeleteHabit, onMenuClick, onOpenStats }) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- Calendar Strip Logic ---
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(selectedDate, { weekStartsOn: 1 }) });

  // --- Habit Filtering ---
  const activeHabits = habits.filter(h => !h.isArchived);
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Group by section (Mocking "Others" if not set)
  const groupedHabits = activeHabits.reduce((acc, habit) => {
      const section = habit.section || 'Others';
      if (!acc[section]) acc[section] = [];
      acc[section].push(habit);
      return acc;
  }, {} as Record<string, Habit[]>);

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  // --- Render Detail View Overlay ---
  if (selectedHabit) {
      return (
          <div className="absolute inset-0 z-30 bg-white h-full w-full">
              <HabitDetailView 
                  habit={selectedHabit}
                  onClose={() => setSelectedHabitId(null)}
                  onToggleCheck={(date) => onToggleHabit(selectedHabit.id, date)}
                  onEdit={(h) => onUpdateHabit(h)}
                  onDelete={onDeleteHabit}
              />
          </div>
      );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 text-slate-900 overflow-hidden relative font-sans">
      
      {/* 1. Header */}
      <div className="h-16 flex items-center justify-between px-4 shrink-0 bg-white z-10 safe-pt border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
            {onMenuClick && (
                <button onClick={onMenuClick} className="text-slate-500 hover:text-slate-800 p-2 -ml-2 active:bg-slate-100 rounded-full transition-colors">
                    <Menu size={24} />
                </button>
            )}
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Habit</h1>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
            {onOpenStats && (
                <button onClick={onOpenStats} className="hover:text-slate-800 transition-colors p-2 -mr-2 active:bg-slate-100 rounded-full" title="Statistics">
                    <PieChart size={22} />
                </button>
            )}
            <button 
                onClick={() => setShowAddSheet(true)}
                className="hover:text-slate-800 transition-colors p-2 -mr-2 active:bg-slate-100 rounded-full"
            >
                <Plus size={24} />
            </button>
        </div>
      </div>

      {/* 2. Calendar Strip - Optimized for Mobile Touch */}
      <div className="px-2 py-4 bg-white border-b border-slate-100 shadow-sm z-0">
          <div className="flex justify-between items-center text-center">
              {weekDays.map(day => {
                  const isSelected = isSameDay(day, selectedDate);
                  return (
                      <button 
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        className="flex flex-col items-center gap-2 py-2 flex-1 touch-manipulation"
                      >
                          <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                              {format(day, 'EEE')}
                          </span>
                          <div className={`
                             w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                             ${isSelected ? 'bg-blue-600 text-white shadow-md scale-110' : 'text-slate-700 bg-slate-50'}
                          `}>
                              {format(day, 'd')}
                          </div>
                      </button>
                  );
              })}
          </div>
      </div>

      {/* 3. Main Content (Habit List) */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 custom-scrollbar pt-4 bg-slate-50">
          
          {(Object.entries(groupedHabits) as [string, Habit[]][]).map(([section, sectionHabits]) => (
              <div key={section} className="mb-6">
                  <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider">{section}</h3>
                      <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          {sectionHabits.length}
                      </div>
                  </div>

                  <div className="space-y-3">
                      {sectionHabits.map(habit => {
                          const isCompleted = habit.history[selectedDateStr]?.completed;
                          
                          return (
                              <div 
                                  key={habit.id}
                                  className="group bg-white rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform touch-manipulation border border-slate-200 shadow-sm hover:shadow-md"
                              >
                                  {/* Left: Check Action */}
                                  <div className="flex items-center gap-4 flex-1">
                                      <button
                                          onClick={(e) => { e.stopPropagation(); onToggleHabit(habit.id, selectedDateStr); }}
                                          className={`
                                              w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0
                                              ${isCompleted ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}
                                          `}
                                          style={{ 
                                              color: isCompleted ? habit.color : undefined, 
                                              backgroundColor: isCompleted ? `${habit.color}20` : undefined 
                                          }}
                                      >
                                          <Check size={28} strokeWidth={isCompleted ? 3 : 2} className={isCompleted ? "" : "opacity-30"}/>
                                      </button>

                                      <div 
                                        className="cursor-pointer flex-1 py-2"
                                        onClick={() => setSelectedHabitId(habit.id)}
                                      >
                                          <h4 className={`text-base font-bold transition-colors mb-0.5 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                              {habit.name}
                                          </h4>
                                          <p className="text-xs text-slate-400 truncate max-w-[150px]">
                                              {habit.quote || "Keep going!"}
                                          </p>
                                      </div>
                                  </div>

                                  {/* Right: Stats */}
                                  <div 
                                    className="flex flex-col items-end cursor-pointer pl-4"
                                    onClick={() => setSelectedHabitId(habit.id)}
                                  >
                                      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-lg mb-1">
                                          {habit.icon}
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          ))}

          {activeHabits.length === 0 && (
              <div className="text-center py-20 opacity-50">
                  <div className="text-6xl mb-4 grayscale opacity-50">🌱</div>
                  <p className="text-slate-400 font-medium">No habits yet.</p>
                  <p className="text-sm text-slate-500 mt-2">Tap + to start a new journey.</p>
              </div>
          )}
      </div>

      <HabitFormSheet 
          isOpen={showAddSheet} 
          onClose={() => setShowAddSheet(false)}
          onSave={(h) => onAddHabit(h)}
      />
    </div>
  );
};

export default HabitView;