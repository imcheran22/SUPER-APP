
import React, { useState, useEffect } from 'react';
import { Habit, HabitFrequencyType, HabitSection, HabitLog } from '../types';
import { 
  Plus, Settings, Check, Clock, BookOpen, Sliders, Menu, ChevronRight, PieChart,
  ArrowLeft, MoreVertical, ChevronLeft, CheckCircle2, X, RefreshCw, Sun, Moon,
  Layout, Target, Quote, ArrowRight, Trash2, ExternalLink, Share2, Flame, CalendarCheck, Award
} from 'lucide-react';
import { 
  format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, subDays,
  startOfMonth, endOfMonth, isSameMonth, subMonths, addMonths, subWeeks, addWeeks, getDay
} from 'date-fns';

// --- Constants & Config ---

const ICONS = ['💧', '📚', '🏃', '🧘', '🍎', '💤', '🎸', '💰', '🧹', '💊', '🐶', '🌿', '🏋️', '📝', '🎨', '💻', '🚲', '🏊', '🎹', '🎮'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
const SECTIONS: HabitSection[] = ['Morning', 'Afternoon', 'Night', 'Others'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CATEGORIES: Record<string, { name: string, icon: string, quote: string, color: string }[]> = {
    'Suggested': [
        { name: 'Daily Check-in', icon: '🙂', quote: 'Try a little harder to be a little better', color: '#10b981' },
        { name: 'Drink water', icon: '💧', quote: 'Stay moisturized', color: '#3b82f6' },
        { name: 'Eat breakfast', icon: '🍳', quote: 'Life begins after breakfast', color: '#f59e0b' },
        { name: 'Eat fruits', icon: '🍌', quote: 'Stay healthier, stay happier', color: '#84cc16' },
        { name: 'Early to rise', icon: '☀️', quote: 'Get up and be amazing', color: '#facc15' },
    ],
    'Life': [
        { name: 'Read', icon: '📘', quote: 'A chapter a day lights your way', color: '#3b82f6' },
        { name: 'Learn a language', icon: '🗣️', quote: 'Expand your world', color: '#8b5cf6' },
        { name: 'Meditate', icon: '🧘', quote: 'Find your inner peace', color: '#10b981' },
        { name: 'Journaling', icon: '✍️', quote: 'Write your thoughts', color: '#f59e0b' },
        { name: 'Spend time with family', icon: '👨‍👩‍👧‍👦', quote: 'Family comes first', color: '#ef4444' },
    ],
    'Health': [
        { name: 'No sugar', icon: '🚫', quote: 'Sweet enough already', color: '#ef4444' },
        { name: 'Take vitamins', icon: '💊', quote: 'Boost your health', color: '#facc15' },
        { name: 'Floss', icon: '🦷', quote: 'Healthy smile', color: '#3b82f6' },
        { name: 'Sleep 8 hours', icon: '😴', quote: 'Rest and recharge', color: '#6366f1' },
        { name: 'Walk', icon: '🚶', quote: 'Keep moving', color: '#10b981' },
    ],
    'Sports': [
        { name: 'Running', icon: '🏃', quote: 'Run for your life', color: '#ef4444' },
        { name: 'Plank', icon: '🪵', quote: 'Core strength', color: '#f59e0b' },
        { name: 'Push-ups', icon: '💪', quote: 'Build strength', color: '#3b82f6' },
        { name: 'Yoga', icon: '🧘', quote: 'Flexibility and balance', color: '#8b5cf6' },
        { name: 'Cycling', icon: '🚴', quote: 'Enjoy the ride', color: '#10b981' },
    ],
    'Mindset': [
        { name: 'Gratitude', icon: '🙏', quote: 'Be thankful', color: '#facc15' },
        { name: 'Positive Affirmation', icon: '✨', quote: 'Believe in yourself', color: '#ec4899' },
        { name: 'Deep breathing', icon: '🌬️', quote: 'Breathe in, breathe out', color: '#3b82f6' },
        { name: 'Visualization', icon: '👁️', quote: 'See your success', color: '#8b5cf6' },
    ]
};

// --- Sub-Component: HabitFormSheet ---

interface HabitFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Habit) => void;
  initialData?: Habit;
}

const HabitFormSheet: React.FC<HabitFormSheetProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [step, setStep] = useState<'gallery' | 'basics' | 'settings'>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<string>('Suggested');
  
  const [name, setName] = useState('');
  const [quote, setQuote] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>([0,1,2,3,4,5,6]);
  const [frequencyCount, setFrequencyCount] = useState<number>(1);
  const [section, setSection] = useState<HabitSection>('Morning');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reminders, setReminders] = useState<string[]>([]);
  
  const [targetValue, setTargetValue] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setStep('settings');
            loadData(initialData);
        } else {
            setStep('gallery');
            resetData();
        }
    }
  }, [isOpen, initialData]);

  const resetData = () => {
      setName('');
      setQuote('');
      setIcon(ICONS[0]);
      setColor(COLORS[0]);
      setFrequencyType('daily');
      setFrequencyDays([0,1,2,3,4,5,6]);
      setFrequencyCount(1);
      setSection('Morning');
      setStartDate(new Date());
      setEndDate(undefined);
      setReminders([]);
      setTargetValue(undefined);
      setUnit('');
      setSelectedCategory('Suggested');
  };

  const loadData = (data: Habit) => {
      setName(data.name);
      setQuote(data.quote || '');
      setIcon(data.icon);
      setColor(data.color);
      setFrequencyType(data.frequencyType || 'daily');
      setFrequencyDays(data.frequencyDays || [0,1,2,3,4,5,6]);
      setFrequencyCount(data.frequencyCount || 1);
      setSection(data.section || 'Morning');
      setStartDate(data.startDate ? new Date(data.startDate) : new Date());
      setEndDate(data.endDate ? new Date(data.endDate) : undefined);
      setReminders(data.reminders || []);
      setTargetValue(data.targetValue);
      setUnit(data.unit || '');
  };

  const handleSelectPreset = (preset: any) => {
      setName(preset.name);
      setIcon(preset.icon);
      setQuote(preset.quote);
      setColor(preset.color);
      setStep('basics');
  };

  const handleSave = () => {
    const newHabit: Habit = {
      id: initialData?.id || Date.now().toString(),
      name,
      icon,
      color,
      description: quote,
      quote,
      goal: frequencyType === 'daily' ? frequencyDays.length : frequencyCount,
      frequencyType,
      frequencyDays,
      frequencyCount,
      section,
      startDate,
      endDate,
      reminders,
      targetValue,
      unit,
      history: initialData?.history || {},
      createdDate: initialData?.createdDate || new Date(),
    };
    onSave(newHabit);
    onClose();
  };

  const toggleDay = (dayIndex: number) => {
      if (frequencyDays.includes(dayIndex)) {
          if (frequencyDays.length > 1) {
              setFrequencyDays(frequencyDays.filter(d => d !== dayIndex));
          }
      } else {
          setFrequencyDays([...frequencyDays, dayIndex].sort());
      }
  };

  const handleFreqTypeChange = (type: HabitFrequencyType) => {
      setFrequencyType(type);
      if (type === 'weekly') setFrequencyCount(3);
      if (type === 'interval') setFrequencyCount(2);
      if (type === 'daily') setFrequencyDays([0,1,2,3,4,5,6]);
  };

  if (!isOpen) return null;

  if (step === 'gallery') {
      return (
        <div className="fixed inset-0 z-[60] bg-[#1e293b] flex flex-col text-white animate-in slide-in-from-bottom duration-300">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-700/50 shrink-0">
                <div className="flex items-center">
                    <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:bg-slate-800 rounded-full"><ArrowLeft size={24}/></button>
                    <span className="text-lg font-bold ml-2">Gallery</span>
                </div>
            </div>
            <div className="flex gap-6 px-6 py-4 border-b border-slate-700/50 overflow-x-auto no-scrollbar shrink-0">
                {Object.keys(CATEGORIES).map((cat) => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-sm font-bold whitespace-nowrap cursor-pointer pb-2 border-b-2 transition-colors ${selectedCategory === cat ? 'text-white border-orange-500' : 'text-slate-500 border-transparent hover:text-slate-400'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#1e293b]">
                {CATEGORIES[selectedCategory]?.map((p, i) => (
                    <div key={i} className="bg-[#293548] p-4 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer hover:bg-[#334155] transition-colors group" onClick={() => handleSelectPreset(p)}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: `${p.color}20` }}>{p.icon}</div>
                            <div>
                                <h3 className="font-bold text-white text-base">{p.name}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{p.quote}</p>
                            </div>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-600 group-hover:text-white transition-colors"><Plus size={18} /></button>
                    </div>
                ))}
            </div>
            <div className="p-4 bg-[#1e293b] border-t border-slate-700/50 shrink-0">
                <button onClick={() => { resetData(); setStep('basics'); }} className="w-full py-3 bg-[#e65100] hover:bg-[#ef6c00] text-white font-bold rounded-full shadow-lg transition-transform active:scale-95">Create a new habit</button>
            </div>
        </div>
      );
  }

  if (step === 'basics') {
      return (
        <div className="fixed inset-0 z-[60] bg-slate-900 text-white flex flex-col animate-in slide-in-from-right duration-300">
            <div className="h-14 flex items-center px-4">
                <button onClick={() => setStep('gallery')} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full"><ArrowLeft size={24}/></button>
                <span className="text-lg font-bold ml-2">New Habit</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Name</label>
                    <div className="bg-slate-800 rounded-xl flex items-center px-4 py-3">
                        <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-white text-lg font-medium placeholder-slate-600" placeholder="Habit Name" autoFocus />
                        {name && <button onClick={() => setName('')} className="p-1 bg-slate-700 rounded-full text-slate-400"><X size={14}/></button>}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center"><label className="text-sm font-bold text-slate-400">Icon</label><div className="w-8 h-8 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: color }}>{icon}</div></div>
                    <div className="bg-slate-800 rounded-2xl p-4">
                        <div className="grid grid-cols-7 gap-3">
                            {ICONS.map(i => <button key={i} onClick={() => setIcon(i)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${icon === i ? 'bg-slate-700 scale-110 ring-2 ring-orange-500' : 'bg-slate-900 hover:bg-slate-700'}`}>{i}</button>)}
                        </div>
                        <div className="flex gap-3 mt-6 overflow-x-auto pb-2 no-scrollbar">
                            {COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full flex-shrink-0 transition-transform ${color === c ? 'scale-110 ring-2 ring-white' : ''}`} style={{ backgroundColor: c }} />)}
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between"><label className="text-sm font-bold text-slate-400">Quote</label><RefreshCw size={14} className="text-orange-500" /></div>
                    <div className="bg-slate-800 rounded-xl px-4 py-3"><input value={quote} onChange={(e) => setQuote(e.target.value)} className="w-full bg-transparent border-none outline-none text-slate-300 text-sm placeholder-slate-600" placeholder="Motivate yourself..." /></div>
                </div>
            </div>
            <div className="p-4 bg-slate-900">
                <button onClick={() => setStep('settings')} disabled={!name} className="w-full py-3 bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-full shadow-lg hover:bg-orange-600 transition-colors">Next</button>
            </div>
        </div>
      );
  }

  const ArrowIcon = <ChevronRight size={16} className="text-slate-500" />;
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900 text-white flex flex-col animate-in slide-in-from-right duration-300">
        <div className="h-14 flex items-center px-4">
            <button onClick={() => { if(initialData) onClose(); else setStep('basics'); }} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full"><ArrowLeft size={24}/></button>
            <span className="text-lg font-bold ml-2">Settings</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="bg-slate-800 rounded-2xl p-1 overflow-hidden">
                <div className="flex p-1 bg-slate-900/50 rounded-xl mb-4">
                    {(['daily', 'weekly', 'interval'] as const).map(f => (
                        <button key={f} onClick={() => handleFreqTypeChange(f)} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${frequencyType === f ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{f}</button>
                    ))}
                </div>
                <div className="px-4 pb-4 flex justify-center min-h-[60px] items-center w-full">
                    {frequencyType === 'daily' && (
                        <div className="flex justify-between w-full">
                            {WEEKDAYS.map((day, i) => (
                                <button key={i} onClick={() => toggleDay(i)} className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${frequencyDays.includes(i) ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-700 text-slate-400'}`}>{day}</button>
                            ))}
                        </div>
                    )}
                    {frequencyType === 'weekly' && (
                        <div className="flex flex-col items-center w-full">
                            <div className="text-4xl font-bold text-white mb-1">{frequencyCount}</div>
                            <div className="text-xs text-slate-400 uppercase font-bold mb-4">Days per week</div>
                            <input type="range" min="1" max="7" value={frequencyCount} onChange={(e) => setFrequencyCount(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"/>
                        </div>
                    )}
                    {frequencyType === 'interval' && (
                        <div className="flex flex-col items-center w-full">
                             <div className="flex items-baseline gap-2 mb-4"><span className="text-slate-400">Every</span><span className="text-4xl font-bold text-white">{frequencyCount}</span><span className="text-slate-400">Days</span></div>
                             <input type="range" min="1" max="30" value={frequencyCount} onChange={(e) => setFrequencyCount(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"/>
                        </div>
                    )}
                </div>
            </div>
            <div className="bg-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-700/50">
                <div onClick={() => setShowGoalModal(true)} className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50"><span className="font-medium text-slate-200">Goal</span><div className="flex items-center gap-2"><span className="text-sm text-slate-500">{targetValue ? `${targetValue} ${unit}` : 'Achieve it all'}</span>{ArrowIcon}</div></div>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50"><span className="font-medium text-slate-200">Start Date</span><div className="flex items-center gap-2"><span className="text-sm text-slate-500">{format(startDate, 'MMM d')}</span>{ArrowIcon}</div></div>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50"><span className="font-medium text-slate-200">Goal Days</span><div className="flex items-center gap-2"><span className="text-sm text-slate-500">{endDate ? format(endDate, 'MMM d, yyyy') : 'Forever'}</span>{ArrowIcon}</div></div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
                 <div className="flex justify-between items-center"><span className="font-medium text-slate-200">Section</span><Plus size={16} className="text-slate-500"/></div>
                 <div className="grid grid-cols-4 gap-2">
                     {SECTIONS.map(s => <button key={s} onClick={() => setSection(s)} className={`py-2 text-xs font-bold rounded-lg transition-colors ${section === s ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{s}</button>)}
                 </div>
            </div>
        </div>
        <div className="p-4 bg-slate-900"><button onClick={handleSave} className="w-full py-3 bg-orange-500 text-white font-bold rounded-full shadow-lg hover:bg-orange-600 transition-colors">Save</button></div>
        {showGoalModal && (
            <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in">
                <div className="bg-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-bold text-white">Goal</h3>
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-700/50 rounded-lg">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!targetValue ? 'border-orange-500' : 'border-slate-500'}`}>{!targetValue && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"/>}</div>
                                <span className={`font-medium ${!targetValue ? 'text-white' : 'text-slate-400'}`}>Achieve it all</span>
                                <input type="radio" checked={!targetValue} onChange={() => setTargetValue(undefined)} className="hidden"/>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-700/50 rounded-lg">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${targetValue ? 'border-orange-500' : 'border-slate-500'}`}>{targetValue && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"/>}</div>
                                <span className={`font-medium ${targetValue ? 'text-white' : 'text-slate-400'}`}>Reach a certain amount</span>
                                <input type="radio" checked={!!targetValue} onChange={() => setTargetValue(1)} className="hidden"/>
                            </label>
                        </div>
                        {targetValue !== undefined && (
                            <div className="bg-slate-900 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2">
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1"><label className="text-xs text-slate-500 font-bold">Daily</label><input type="number" value={targetValue} onChange={(e) => setTargetValue(Number(e.target.value))} className="w-full bg-slate-800 text-white p-2 rounded-lg outline-none border border-slate-700 focus:border-orange-500"/></div>
                                    <div className="flex-1 space-y-1"><label className="text-xs text-slate-500 font-bold">Unit</label><input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Count" className="w-full bg-slate-800 text-white p-2 rounded-lg outline-none border border-slate-700 focus:border-orange-500"/></div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end p-4 gap-4 bg-slate-900/50">
                        <button onClick={() => setShowGoalModal(false)} className="text-slate-400 font-bold hover:text-white px-4 py-2 rounded-lg transition-colors">CANCEL</button>
                        <button onClick={() => setShowGoalModal(false)} className="text-orange-500 font-bold hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors">OK</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

// --- Sub-Component: HabitDetailView ---

interface HabitDetailViewProps {
  habit: Habit;
  onClose: () => void;
  onToggleCheck: (dateStr: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

const HabitDetailView: React.FC<HabitDetailViewProps> = ({ habit, onClose, onToggleCheck, onDelete, onEdit }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const currentMonthStr = format(currentMonth, 'yyyy-MM');
  const monthLogs = (Object.entries(habit.history) as [string, HabitLog][]).filter(([date, log]) => date.startsWith(currentMonthStr) && log.completed);
  const totalCheckins = Object.values(habit.history).filter((h: HabitLog) => h.completed).length;
  const monthlyCheckins = monthLogs.length;
  const daysInCurrentMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).length;
  const completionRate = Math.round((monthlyCheckins / daysInCurrentMonth) * 100);

  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const log = habit.history[dateStr] as HabitLog | undefined;
        if (log?.completed) streak++;
        else if (i === 0 && !log?.completed) continue; 
        else break;
    }
    return streak;
  };
  const streak = calculateStreak();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart, {weekStartsOn:0}), end: endOfWeek(monthEnd, {weekStartsOn:0}) });
  const logsSorted = (Object.entries(habit.history) as [string, HabitLog][])
    .filter(([date, log]) => date.startsWith(currentMonthStr) && log.completed)
    .sort((a, b) => b[0].localeCompare(a[0]));
    
  // Simple edit handling
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="h-full flex flex-col bg-white text-slate-900 animate-in slide-in-from-right duration-300 font-sans z-40 relative">
      <div className="h-16 flex items-center justify-between px-4 shrink-0 border-b border-slate-100 bg-white z-10">
          <div className="flex items-center gap-4">
              <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-2 -ml-2 rounded-full hover:bg-slate-50"><ArrowLeft size={24} /></button>
              <h1 className="text-xl font-bold text-slate-800">{habit.name}</h1>
          </div>
          <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="text-slate-500 hover:text-slate-800 p-2 -mr-2 rounded-full hover:bg-slate-50"><MoreVertical size={24} /></button>
              {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}/>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 animate-in zoom-in-95">
                        <button 
                            onClick={() => { setShowEditSheet(true); setShowMenu(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-3"
                        >
                            <Settings size={16} /> Edit Habit
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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-slate-50">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-slate-800 font-bold text-lg">{format(currentMonth, 'MMMM yyyy')}</span>
                <div className="flex gap-4 text-slate-400">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="hover:text-slate-600"><ChevronLeft size={20}/></button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="hover:text-slate-600"><ChevronRight size={20}/></button>
                </div>
            </div>
            <div className="grid grid-cols-7 mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center text-[11px] font-bold text-slate-400 uppercase">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-2">
                {calendarDays.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCompleted = habit.history[dateStr]?.completed;
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    return (
                        <div key={i} className="flex justify-center items-center h-10">
                            <button
                                onClick={() => onToggleCheck(dateStr)}
                                disabled={!isCurrentMonth}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-600'} ${isCompleted ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100'} ${isCurrentMonth && !isCompleted ? 'bg-slate-50' : ''}`}
                                style={isCompleted ? { backgroundColor: habit.color, boxShadow: `0 2px 6px ${habit.color}60` } : undefined}
                            >
                                {format(day, 'd')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>

        <div>
            <h3 className="text-slate-700 font-bold mb-3 px-1">Check-ins Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 flex flex-col gap-1 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-1"><CheckCircle2 size={16} className="text-emerald-500" /><span className="text-slate-500 text-xs font-medium">Monthly check-ins</span></div>
                    <div className="text-2xl font-bold text-slate-800">{monthlyCheckins} <span className="text-sm font-normal text-slate-400">Days</span></div>
                </div>
                <div className="bg-white rounded-xl p-4 flex flex-col gap-1 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-1"><CheckCircle2 size={16} className="text-blue-500" /><span className="text-slate-500 text-xs font-medium">Total check-ins</span></div>
                    <div className="text-2xl font-bold text-slate-800">{totalCheckins} <span className="text-sm font-normal text-slate-400">Days</span></div>
                </div>
                <div className="bg-white rounded-xl p-4 flex flex-col gap-1 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-1"><span className="text-orange-500 text-xs font-bold">%</span><span className="text-slate-500 text-xs font-medium">Monthly rate</span></div>
                    <div className="text-2xl font-bold text-slate-800">{completionRate} <span className="text-sm font-normal text-slate-400">%</span></div>
                </div>
                <div className="bg-white rounded-xl p-4 flex flex-col gap-1 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-1"><span className="text-blue-500 text-xs font-bold">~</span><span className="text-slate-500 text-xs font-medium">Streak</span></div>
                    <div className="text-2xl font-bold text-slate-800">{streak} <span className="text-sm font-normal text-slate-400">Days</span></div>
                </div>
            </div>
        </div>

        <div className="pb-10">
            <div className="flex items-center justify-between mb-3 px-1"><h3 className="text-slate-700 font-bold">Habit Log on {format(currentMonth, 'MMMM')}</h3></div>
            <div className="space-y-4 pl-2">
                {logsSorted.length === 0 && <div className="text-slate-400 text-sm italic py-4">No logs this month.</div>}
                {logsSorted.map(([date, logItem]) => {
                     const log = logItem as HabitLog;
                     return (
                         <div key={date} className="flex gap-3 items-start">
                             <div className="mt-1"><div className="w-5 h-5 rounded flex items-center justify-center text-white" style={{ backgroundColor: habit.color || '#3b82f6' }}><Check size={14} strokeWidth={3} /></div></div>
                             <div className="flex-1 border-b border-slate-100 pb-3">
                                 <div className="flex items-center gap-2"><span className="text-slate-500 text-sm font-medium">{format(new Date(date), 'EEE, MMM d')}</span><span className="text-lg">{log.mood || '😄'}</span></div>
                                 <div className="text-slate-700 text-sm mt-0.5">{log.note || 'Checked in'}</div>
                             </div>
                         </div>
                     )
                })}
            </div>
        </div>
      </div>
      
      {showEditSheet && (
          <HabitFormSheet 
            isOpen={true} 
            onClose={() => setShowEditSheet(false)} 
            onSave={(h) => onEdit(h)} 
            initialData={habit}
          />
      )}
    </div>
  );
};

// --- Sub-Component: HabitStatsView ---

type Tab = 'Week' | 'Month' | 'Record';

export const HabitStatsView: React.FC<{ habits: Habit[]; onClose?: () => void }> = ({ habits, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const activeHabits = habits.filter(h => !h.isArchived);

  const renderWeekView = () => {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
      return (
          <div className="p-4 animate-in fade-in">
              <div className="flex items-center justify-between mb-6 px-2">
                  <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={20}/></button>
                  <span className="text-slate-800 font-bold">This Week</span>
                  <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={20}/></button>
              </div>
              <div className="bg-white rounded-2xl p-4 overflow-x-auto border border-slate-200 shadow-sm">
                  <table className="w-full border-collapse">
                      <thead>
                          <tr>
                              <th className="text-left pb-4 text-slate-500 font-medium text-xs">Habit</th>
                              {weekDays.map(day => <th key={day.toString()} className="pb-4 text-center"><div className="text-slate-400 text-[10px] uppercase font-bold mb-1">{format(day, 'EEE').slice(0, 2)}</div></th>)}
                          </tr>
                      </thead>
                      <tbody className="space-y-4">
                          {activeHabits.map(habit => (
                              <tr key={habit.id} className="group border-b border-slate-50 last:border-0">
                                  <td className="py-3 pr-4"><div className="flex items-center gap-2"><span className="text-lg">{habit.icon}</span><span className="text-slate-700 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{habit.name}</span></div></td>
                                  {weekDays.map(day => {
                                      const dateStr = format(day, 'yyyy-MM-dd');
                                      const completed = habit.history[dateStr]?.completed;
                                      return <td key={day.toString()} className="py-3 text-center"><div className={`w-6 h-6 rounded mx-auto transition-all ${completed ? '' : 'bg-slate-100'}`} style={{ backgroundColor: completed ? habit.color : undefined }} /></td>
                                  })}
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  const renderMonthView = () => {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const startDay = getDay(monthStart);
      const paddedDays = Array(startDay).fill(null).concat(daysInMonth);
      return (
          <div className="p-4 animate-in fade-in">
               <div className="flex items-center justify-between mb-6 px-2">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={20}/></button>
                  <span className="text-slate-800 font-bold text-lg">{format(currentDate, 'MMM')}</span>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={20}/></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  {activeHabits.map(habit => (
                      <div key={habit.id} className="bg-white rounded-2xl p-4 flex flex-col gap-3 border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-1"><span>{habit.icon}</span><span className="text-slate-800 font-medium text-sm truncate">{habit.name}</span></div>
                          <div className="grid grid-cols-7 gap-1">
                              {paddedDays.map((day, i) => {
                                  if (!day) return <div key={i} className="w-full pt-[100%]" />; 
                                  const dateStr = format(day, 'yyyy-MM-dd');
                                  const completed = habit.history[dateStr]?.completed;
                                  return <div key={i} className={`w-full pt-[100%] rounded-sm relative ${completed ? '' : 'bg-slate-100'}`} style={{ backgroundColor: completed ? habit.color : undefined }}></div>;
                              })}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const renderRecordView = () => {
      const allLogs = activeHabits.flatMap(h => (Object.entries(h.history) as [string, HabitLog][]).map(([date, log]) => ({ habit: h, date, ...log }))).sort((a, b) => b.date.localeCompare(a.date));
      return (
          <div className="p-4 animate-in fade-in">
              <div className="space-y-4">
                  {allLogs.length === 0 && <div className="text-slate-400 text-center py-10">No records found.</div>}
                  {allLogs.map((log, i) => (
                      <div key={i} className="flex gap-4">
                          <div className="w-12 text-center pt-1"><div className="text-sm font-bold text-slate-400">{format(new Date(log.date), 'MMM')}</div><div className="text-xl font-bold text-slate-800">{format(new Date(log.date), 'dd')}</div></div>
                          <div className="flex-1 bg-white p-3 rounded-xl flex items-center gap-3 border border-slate-200 shadow-sm"><div className="text-2xl">{log.habit.icon}</div><div><div className="font-bold text-slate-800">{log.habit.name}</div><div className="text-xs text-slate-500">{log.completed ? 'Completed' : 'Skipped'}</div></div>{log.mood && <div className="ml-auto text-xl">{log.mood}</div>}</div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 text-slate-900 relative overflow-hidden font-sans">
        <div className="h-14 flex items-center justify-between px-4 shrink-0 bg-white z-10 border-b border-slate-200 shadow-sm">
             {onClose ? <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:text-slate-800"><X size={24}/></button> : <div className="w-10"></div>}
             <div className="flex bg-slate-100 rounded-lg p-1">
                  {(['Week', 'Month', 'Record'] as Tab[]).map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1 text-xs font-bold rounded-md transition-colors ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
                  ))}
             </div>
             <button className="p-2 text-slate-500 hover:text-slate-800"><Share2 size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'Week' && renderWeekView()}
            {activeTab === 'Month' && renderMonthView()}
            {activeTab === 'Record' && renderRecordView()}
        </div>
    </div>
  );
};

// --- Main Component: HabitView ---

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

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(selectedDate, { weekStartsOn: 1 }) });
  const activeHabits = habits.filter(h => !h.isArchived);
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const groupedHabits = activeHabits.reduce((acc, habit) => {
      const section = habit.section || 'Others';
      if (!acc[section]) acc[section] = [];
      acc[section].push(habit);
      return acc;
  }, {} as Record<string, Habit[]>);

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  if (selectedHabit) {
      return (
          <div className="absolute inset-0 z-30 bg-white h-full w-full">
              <HabitDetailView 
                  habit={selectedHabit}
                  onClose={() => setSelectedHabitId(null)}
                  onToggleCheck={(date) => onToggleHabit(selectedHabit.id, date)}
                  onEdit={(h) => onUpdateHabit(h)}
                  onDelete={(id) => { onDeleteHabit(id); setSelectedHabitId(null); }}
              />
          </div>
      );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 text-slate-900 overflow-hidden relative font-sans">
      <div className="h-16 flex items-center justify-between px-4 shrink-0 bg-white z-10 safe-pt border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
            {onMenuClick && (
                <button onClick={onMenuClick} className="text-slate-500 hover:text-slate-800 p-2 -ml-2 active:bg-slate-100 rounded-full transition-colors"><Menu size={24} /></button>
            )}
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Habit</h1>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
            {onOpenStats && (
                <button onClick={onOpenStats} className="hover:text-slate-800 transition-colors p-2 -mr-2 active:bg-slate-100 rounded-full" title="Statistics"><PieChart size={22} /></button>
            )}
            <button onClick={() => setShowAddSheet(true)} className="hover:text-slate-800 transition-colors p-2 -mr-2 active:bg-slate-100 rounded-full"><Plus size={24} /></button>
        </div>
      </div>

      <div className="px-2 py-4 bg-white border-b border-slate-100 shadow-sm z-0">
          <div className="flex justify-between items-center text-center">
              {weekDays.map(day => {
                  const isSelected = isSameDay(day, selectedDate);
                  return (
                      <button key={day.toString()} onClick={() => setSelectedDate(day)} className="flex flex-col items-center gap-2 py-2 flex-1 touch-manipulation">
                          <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{format(day, 'EEE')}</span>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md scale-110' : 'text-slate-700 bg-slate-50'}`}>{format(day, 'd')}</div>
                      </button>
                  );
              })}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 custom-scrollbar pt-4 bg-slate-50">
          {(Object.entries(groupedHabits) as [string, Habit[]][]).map(([section, sectionHabits]) => (
              <div key={section} className="mb-6">
                  <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider">{section}</h3>
                      <div className="text-xs text-slate-400 font-medium flex items-center gap-1">{sectionHabits.length}</div>
                  </div>
                  <div className="space-y-3">
                      {sectionHabits.map(habit => {
                          const isCompleted = habit.history[selectedDateStr]?.completed;
                          return (
                              <div key={habit.id} className="group bg-white rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform touch-manipulation border border-slate-200 shadow-sm hover:shadow-md">
                                  <div className="flex items-center gap-4 flex-1">
                                      <button onClick={(e) => { e.stopPropagation(); onToggleHabit(habit.id, selectedDateStr); }} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${isCompleted ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`} style={{ color: isCompleted ? habit.color : undefined, backgroundColor: isCompleted ? `${habit.color}20` : undefined }}>
                                          <Check size={28} strokeWidth={isCompleted ? 3 : 2} className={isCompleted ? "" : "opacity-30"}/>
                                      </button>
                                      <div className="cursor-pointer flex-1 py-2" onClick={() => setSelectedHabitId(habit.id)}>
                                          <h4 className={`text-base font-bold transition-colors mb-0.5 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{habit.name}</h4>
                                          <p className="text-xs text-slate-400 truncate max-w-[150px]">{habit.quote || "Keep going!"}</p>
                                      </div>
                                  </div>
                                  <div className="flex flex-col items-end cursor-pointer pl-4" onClick={() => setSelectedHabitId(habit.id)}>
                                      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-lg mb-1">{habit.icon}</div>
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

      <HabitFormSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} onSave={(h) => onAddHabit(h)} />
    </div>
  );
};

export default HabitView;
