import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Briefcase, Book, Dumbbell, Code, Coffee, Music, Zap, Brain, Plus, X, CheckSquare, Menu, TrendingUp, Clock, CalendarDays, Target, Edit2 } from 'lucide-react';
import { FocusCategory, TimerMode, Task, FocusSession } from '../types';
import { getProductivityTips } from '../services/geminiService';
import { format, isSameDay, subDays, eachDayOfInterval } from 'date-fns';
import { WheelPicker } from './WheelPicker';

interface FocusViewProps {
  categories: FocusCategory[];
  onAddCategory: (category: FocusCategory) => void;
  activeTask?: Task;
  onFocusComplete: (duration: number, taskId?: string, categoryId?: string) => void;
  onMenuClick?: () => void;
  focusSessions: FocusSession[];
}

type FocusTab = 'timer' | 'stats';

const FocusView: React.FC<FocusViewProps> = ({ categories, onAddCategory, activeTask, onFocusComplete, onMenuClick, focusSessions = [] }) => {
  const [activeTab, setActiveTab] = useState<FocusTab>('timer');
  const [selectedCategory, setSelectedCategory] = useState<FocusCategory>(categories[0]);
  const [timeLeft, setTimeLeft] = useState(selectedCategory.defaultDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [tip, setTip] = useState<string>('');
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  
  // Time Editor State
  const [editHours, setEditHours] = useState('00');
  const [editMinutes, setEditMinutes] = useState('25');

  // New Category Form State
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('briefcase');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [newMode, setNewMode] = useState<TimerMode>('pomo');
  const [newDuration, setNewDuration] = useState(25);

  const hours = Array.from({ length: 12 }, (_, i) => i.toString().padStart(2, '0')); // 0-11 hours
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')); // 0-59 minutes
  const categoryIcons = ['briefcase', 'book', 'dumbbell', 'code', 'coffee', 'music', 'zap', 'brain'];
  const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    if (!isActive) {
        setTimeLeft(selectedCategory.defaultDuration * 60);
        setStopwatchTime(0);
    }
  }, [selectedCategory, isActive]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive) {
      interval = setInterval(() => {
        if (selectedCategory.mode === 'pomo') {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsActive(false);
                    // Automatically complete when timer hits 0
                    if (onFocusComplete) {
                        onFocusComplete(selectedCategory.defaultDuration, activeTask?.id, selectedCategory.id);
                    }
                    return 0;
                }
                return prev - 1;
            });
        } else {
            setStopwatchTime(prev => prev + 1);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, selectedCategory.mode, activeTask, onFocusComplete, selectedCategory.defaultDuration, selectedCategory.id]);

  useEffect(() => {
    if (isActive) {
         getProductivityTips(selectedCategory.defaultDuration, 5).then(setTip);
    }
  }, [isActive, selectedCategory.defaultDuration]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(selectedCategory.defaultDuration * 60);
    setStopwatchTime(0);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
      if (selectedCategory.mode === 'stopwatch') return 100;
      
      let total = selectedCategory.defaultDuration * 60;
      
      if (timeLeft > total) total = timeLeft; 
      if (total === 0) return 0;
      
      return (timeLeft / total) * 100;
  };

  const handleEditTime = () => {
      if (isActive) setIsActive(false);
      
      const currentSeconds = selectedCategory.mode === 'pomo' ? timeLeft : stopwatchTime;
      const h = Math.floor(currentSeconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((currentSeconds % 3600) / 60).toString().padStart(2, '0');
      
      setEditHours(h);
      setEditMinutes(m);
      setShowTimeEditor(true);
  };

  const saveEditedTime = () => {
      const h = parseInt(editHours);
      const m = parseInt(editMinutes);
      const totalSeconds = (h * 3600) + (m * 60);
      
      if (selectedCategory.mode === 'pomo') {
          setTimeLeft(totalSeconds);
      } else {
          setStopwatchTime(totalSeconds);
      }
      setShowTimeEditor(false);
  };

  const getIcon = (iconName: string, size = 20, className = "") => {
      const props = { size, className };
      switch (iconName) {
          case 'briefcase': return <Briefcase {...props} />;
          case 'book': return <Book {...props} />;
          case 'dumbbell': return <Dumbbell {...props} />;
          case 'code': return <Code {...props} />;
          case 'coffee': return <Coffee {...props} />;
          case 'music': return <Music {...props} />;
          case 'zap': return <Zap {...props} />;
          case 'brain': return <Brain {...props} />;
          default: return <Briefcase {...props} />;
      }
  };

  const handleSaveCategory = () => {
      if (!newName.trim()) return;
      const newCat: FocusCategory = {
          id: Date.now().toString(),
          name: newName,
          icon: newIcon,
          color: newColor,
          mode: newMode,
          defaultDuration: newDuration
      };
      onAddCategory(newCat);
      setSelectedCategory(newCat);
      setShowAddModal(false);
      setNewName('');
      setNewMode('pomo');
      setNewDuration(25);
  };

  const isPomo = selectedCategory.mode === 'pomo';

  // --- Stats Logic ---
  const totalMinutes = focusSessions.reduce((acc, curr) => acc + curr.duration, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalSessions = focusSessions.length;
  const today = new Date();
  const todaySessions = focusSessions.filter(s => isSameDay(new Date(s.timestamp), today));
  const todayMinutes = todaySessions.reduce((acc, curr) => acc + curr.duration, 0);
  const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
  const chartData = last7Days.map(day => {
      const dayMinutes = focusSessions
          .filter(s => isSameDay(new Date(s.timestamp), day))
          .reduce((acc, curr) => acc + curr.duration, 0);
      return {
          label: format(day, 'EEE'),
          value: dayMinutes,
          isToday: isSameDay(day, today)
      };
  });
  const maxMinutes = Math.max(...chartData.map(d => d.value), 60);

  // --- Render Functions ---

  const renderTimerView = () => (
      <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full">
           {/* Active Task Indicator */}
           {activeTask && (
              <div className="mb-8 bg-blue-50 px-6 py-3 rounded-full flex items-center gap-3 animate-in slide-in-from-top-4 border border-blue-100">
                  <div className="bg-blue-500 rounded-full p-1">
                      <CheckSquare size={14} className="text-white"/>
                  </div>
                  <div className="font-medium text-slate-700">
                      {activeTask.title}
                  </div>
              </div>
          )}

          {/* Progress Circle / Timer */}
          <div className="relative w-72 h-72 flex items-center justify-center">
              {/* SVG Circle */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="140" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle 
                      cx="50%" cy="50%" r="140" fill="none" stroke={selectedCategory.color} strokeWidth="8" 
                      strokeDasharray={2 * Math.PI * 140}
                      strokeDashoffset={2 * Math.PI * 140 * (1 - getProgress() / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                  />
              </svg>

              <div className="flex flex-col items-center z-10 group">
                  <button 
                      onClick={handleEditTime}
                      className="text-7xl font-bold font-mono tracking-wider tabular-nums text-slate-800 hover:text-slate-600 transition-colors flex items-center gap-2 relative"
                      title="Click to edit time"
                  >
                      {isPomo ? formatTime(timeLeft) : formatTime(stopwatchTime)}
                  </button>
                  <div className={`font-medium mt-2 flex items-center gap-2 text-slate-500`}>
                       {getIcon(selectedCategory.icon, 16, selectedCategory.color)} 
                       <span style={{ color: selectedCategory.color }}>{selectedCategory.name}</span>
                  </div>
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400 font-medium">Tap time to edit</div>
              </div>
          </div>

          {/* Controls */}
          <div className="mt-12 flex items-center gap-6">
              <button 
                  onClick={resetTimer}
                  className="p-4 rounded-full transition-all shadow-sm border bg-white hover:bg-slate-50 text-slate-400 border-slate-200"
                  disabled={!isActive && (isPomo ? timeLeft === selectedCategory.defaultDuration * 60 : stopwatchTime === 0)}
              >
                  <RotateCcw size={24} />
              </button>
              <button 
                  onClick={toggleTimer}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95`}
                  style={{ backgroundColor: isActive ? '#ef4444' : selectedCategory.color }}
              >
                  {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
          </div>

          {/* Tip */}
          <div className="absolute bottom-8 left-0 right-0 text-center px-8 text-sm font-medium animate-pulse text-slate-400">
              {tip || "Stay focused. You got this."}
          </div>
      </div>
  );

  const renderStatsView = () => (
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 w-full max-w-4xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2">
                      <Clock size={20} />
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{totalHours} <span className="text-sm font-medium text-slate-400">hr</span></div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Focused</div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-2">
                      <Target size={20} />
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{totalSessions}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Sessions</div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-2">
                      <CalendarDays size={20} />
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{todayMinutes} <span className="text-sm font-medium text-slate-400">min</span></div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Today</div>
              </div>
          </div>

          {/* Weekly Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-700 mb-6">Focus Duration (Last 7 Days)</h3>
              <div className="flex items-end justify-between h-48 gap-2">
                  {chartData.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="w-full bg-slate-100 rounded-t-lg relative flex items-end justify-center overflow-hidden group-hover:bg-slate-200 transition-colors" style={{ height: '100%' }}>
                              <div 
                                  className={`w-full transition-all duration-500 ${d.isToday ? 'bg-blue-500' : 'bg-blue-300'}`}
                                  style={{ height: `${(d.value / maxMinutes) * 100}%` }}
                              ></div>
                              <div className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  {d.value}m
                              </div>
                          </div>
                          <span className={`text-xs font-bold ${d.isToday ? 'text-blue-600' : 'text-slate-400'}`}>{d.label}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-700">Recent Sessions</h3>
              </div>
              <div className="divide-y divide-slate-100">
                  {focusSessions.length === 0 && (
                      <div className="p-8 text-center text-slate-400">
                          No focus sessions recorded yet. Start a timer!
                      </div>
                  )}
                  {focusSessions.slice(0, 5).map(session => (
                      <div key={session.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold">
                                  {session.duration}
                              </div>
                              <div>
                                  <div className="font-bold text-slate-700 text-sm">
                                      {session.taskTitle || "Focus Session"}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                      {format(new Date(session.timestamp), 'MMM d, h:mm a')}
                                  </div>
                              </div>
                          </div>
                          <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                              {session.duration} min
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden transition-colors duration-500 animate-in fade-in bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 shrink-0 z-10 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
               <button onClick={onMenuClick} className="p-2 rounded-full transition-colors bg-slate-50 hover:bg-slate-100 text-slate-600">
                   <Menu size={20} />
               </button>
               
               <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                   <button 
                       onClick={() => setActiveTab('timer')}
                       className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${activeTab === 'timer' ? 'bg-white shadow-sm text-slate-900' : 'hover:bg-slate-200 text-slate-500'}`}
                   >
                       <Clock size={16} /> Timer
                   </button>
                   <button 
                       onClick={() => setActiveTab('stats')}
                       className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${activeTab === 'stats' ? 'bg-white shadow-sm text-slate-900' : 'hover:bg-slate-200 text-slate-500'}`}
                   >
                       <TrendingUp size={16} /> Stats
                   </button>
               </div>
          </div>
          
          {activeTab === 'timer' && (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAddModal(true)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                   <Plus size={20} className="text-slate-600" />
                </button>
                <div className="flex bg-slate-100 rounded-lg p-1 gap-1 overflow-x-auto no-scrollbar max-w-[150px] sm:max-w-none">
                    {categories.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat)}
                            className={`p-2 rounded-md transition-all shrink-0 ${selectedCategory.id === cat.id ? 'bg-white shadow-sm text-slate-900' : 'hover:bg-slate-200 text-slate-500'}`}
                            title={cat.name}
                        >
                            {getIcon(cat.icon, 16)}
                        </button>
                    ))}
                </div>
              </div>
          )}
      </div>

      {activeTab === 'timer' && renderTimerView()}
      {activeTab === 'stats' && renderStatsView()}

      {/* Time Editor Modal */}
      {showTimeEditor && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                 <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg">Edit Timer</h3>
                      <button onClick={() => setShowTimeEditor(false)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  <div className="flex items-center justify-center gap-2 h-48 bg-slate-50 rounded-xl mb-6 border border-slate-100 relative overflow-hidden">
                       <WheelPicker items={hours} selected={editHours} onSelect={setEditHours} />
                       <span className="text-2xl font-bold text-slate-300 pb-2">:</span>
                       <WheelPicker items={minutes} selected={editMinutes} onSelect={setEditMinutes} />
                       
                       {/* Labels */}
                       <div className="absolute bottom-2 left-0 w-full flex justify-center gap-16 pointer-events-none">
                           <span className="text-xs font-bold text-slate-400">Hr</span>
                           <span className="text-xs font-bold text-slate-400 ml-2">Min</span>
                       </div>
                  </div>
                  <button onClick={saveEditedTime} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                      Set Time
                  </button>
            </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg">New Focus Category</h3>
                      <button onClick={() => setShowAddModal(false)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  <div className="space-y-4">
                      <input 
                          value={newName} onChange={e => setNewName(e.target.value)}
                          placeholder="Category Name"
                          className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                      />
                      <div className="grid grid-cols-4 gap-2">
                          {categoryIcons.map(icon => (
                              <button key={icon} onClick={() => setNewIcon(icon)} className={`p-3 rounded-lg flex items-center justify-center border transition-all ${newIcon === icon ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 hover:bg-slate-50'}`}>
                                  {getIcon(icon, 20)}
                              </button>
                          ))}
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                           {colors.map(c => (
                               <button key={c} onClick={() => setNewColor(c)} className={`w-8 h-8 rounded-full shrink-0 border-2 ${newColor === c ? 'border-slate-800' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                           ))}
                      </div>
                      <div className="bg-slate-50 p-1 rounded-lg flex text-sm font-bold">
                          <button onClick={() => setNewMode('pomo')} className={`flex-1 py-2 rounded-md transition-colors ${newMode === 'pomo' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Pomo</button>
                          <button onClick={() => setNewMode('stopwatch')} className={`flex-1 py-2 rounded-md transition-colors ${newMode === 'stopwatch' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Stopwatch</button>
                      </div>
                      {newMode === 'pomo' && (
                          <div>
                              <label className="text-xs font-bold text-slate-500 mb-1 block">Duration (min)</label>
                              <input type="number" value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500" />
                          </div>
                      )}
                      <button onClick={handleSaveCategory} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                          Create Category
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FocusView;