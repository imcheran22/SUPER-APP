import React, { useState, useEffect } from 'react';
import { Habit, HabitFrequencyType, HabitSection } from '../types';
import { 
  X, Check, ChevronRight, ChevronLeft, Plus, 
  Calendar, Clock, Bell, RefreshCw, Sun, Moon, Coffee, 
  Layout, Target, Quote, Image as ImageIcon,
  ArrowRight, ArrowLeft, Trash2, Settings
} from 'lucide-react';
import { format, addYears } from 'date-fns';

interface HabitFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Habit) => void;
  initialData?: Habit;
}

const ICONS = ['💧', '📚', '🏃', '🧘', '🍎', '💤', '🎸', '💰', '🧹', '💊', '🐶', '🌿', '🏋️', '📝', '🎨', '💻', '🚲', '🏊', '🎹', '🎮'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

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

const SECTIONS: HabitSection[] = ['Morning', 'Afternoon', 'Night', 'Others'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const HabitFormSheet: React.FC<HabitFormSheetProps> = ({ isOpen, onClose, onSave, initialData }) => {
  // Navigation State
  const [step, setStep] = useState<'gallery' | 'basics' | 'settings'>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<string>('Suggested');
  
  // Data State
  const [name, setName] = useState('');
  const [quote, setQuote] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  
  // Settings State
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>([0,1,2,3,4,5,6]); // All days
  const [frequencyCount, setFrequencyCount] = useState<number>(1);
  const [section, setSection] = useState<HabitSection>('Morning');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined); // Forever
  const [reminders, setReminders] = useState<string[]>([]);
  
  // Goal State
  const [targetValue, setTargetValue] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            // Edit Mode
            setStep('settings');
            loadData(initialData);
        } else {
            // Create Mode
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
      // 0 = Sunday, 1 = Monday, etc.
      if (frequencyDays.includes(dayIndex)) {
          // Don't allow deselecting the last day
          if (frequencyDays.length > 1) {
              setFrequencyDays(frequencyDays.filter(d => d !== dayIndex));
          }
      } else {
          setFrequencyDays([...frequencyDays, dayIndex].sort());
      }
  };

  const addReminder = () => {
      setReminders([...reminders, "09:00"]);
  };

  const removeReminder = (index: number) => {
      setReminders(reminders.filter((_, i) => i !== index));
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
        <div className="fixed inset-0 z-[60] bg-[#1e293b] animate-android-view flex flex-col text-white">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-700/50 shrink-0">
                <div className="flex items-center">
                    <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:bg-slate-800 rounded-full"><ArrowLeft size={24}/></button>
                    <span className="text-lg font-bold ml-2">Gallery</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <button className="p-2 hover:bg-slate-800 rounded-full"><Trash2 size={20}/></button>
                    <button className="p-2 hover:bg-slate-800 rounded-full"><Settings size={20}/></button>
                    <button onClick={() => { resetData(); setStep('basics'); }} className="p-2 bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 rounded-full"><Plus size={20}/></button>
                </div>
            </div>

            <div className="flex gap-6 px-6 py-4 border-b border-slate-700/50 overflow-x-auto no-scrollbar shrink-0">
                {Object.keys(CATEGORIES).map((cat) => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-sm font-bold whitespace-nowrap cursor-pointer pb-2 border-b-2 transition-colors ${
                            selectedCategory === cat 
                            ? 'text-white border-orange-500' 
                            : 'text-slate-500 border-transparent hover:text-slate-400'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#1e293b]">
                {CATEGORIES[selectedCategory]?.map((p, i) => (
                    <div key={i} className="bg-[#293548] p-4 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer hover:bg-[#334155] transition-colors group" onClick={() => handleSelectPreset(p)}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: `${p.color}20` }}>
                                {p.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">{p.name}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{p.quote}</p>
                            </div>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-600 group-hover:text-white transition-colors">
                            <Plus size={18} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-[#1e293b] border-t border-slate-700/50 shrink-0">
                <button 
                    onClick={() => { resetData(); setStep('basics'); }}
                    className="w-full py-3 bg-[#e65100] hover:bg-[#ef6c00] text-white font-bold rounded-full shadow-lg transition-transform active:scale-95"
                >
                    Create a new habit
                </button>
            </div>
        </div>
      );
  }

  if (step === 'basics') {
      return (
        <div className="fixed inset-0 z-[60] bg-slate-900 text-white animate-android-view flex flex-col">
            <div className="h-14 flex items-center px-4">
                <button onClick={() => setStep('gallery')} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full"><ArrowLeft size={24}/></button>
                <span className="text-lg font-bold ml-2">New Habit</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Name</label>
                    <div className="bg-slate-800 rounded-xl flex items-center px-4 py-3">
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-white text-lg font-medium placeholder-slate-600"
                            placeholder="Habit Name"
                            autoFocus
                        />
                        {name && <button onClick={() => setName('')} className="p-1 bg-slate-700 rounded-full text-slate-400"><X size={14}/></button>}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-400">Icon</label>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: color }}>
                            {icon}
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-2xl p-4">
                        <div className="grid grid-cols-7 gap-3">
                            {ICONS.map(i => (
                                <button
                                    key={i}
                                    onClick={() => setIcon(i)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${icon === i ? 'bg-slate-700 scale-110 ring-2 ring-orange-500' : 'bg-slate-900 hover:bg-slate-700'}`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-6 overflow-x-auto pb-2 no-scrollbar">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full flex-shrink-0 transition-transform ${color === c ? 'scale-110 ring-2 ring-white' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                         <label className="text-sm font-bold text-slate-400">Quote</label>
                         <RefreshCw size={14} className="text-orange-500" />
                    </div>
                    <div className="bg-slate-800 rounded-xl px-4 py-3">
                        <input 
                            value={quote}
                            onChange={(e) => setQuote(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-slate-300 text-sm placeholder-slate-600"
                            placeholder="Motivate yourself..."
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-900">
                <button 
                    onClick={() => setStep('settings')}
                    disabled={!name}
                    className="w-full py-3 bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-full shadow-lg hover:bg-orange-600 transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
      );
  }

  const ArrowIcon = <ChevronRight size={16} className="text-slate-500" />;
  
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900 text-white animate-android-view flex flex-col">
        <div className="h-14 flex items-center px-4">
            <button onClick={() => setStep('basics')} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full"><ArrowLeft size={24}/></button>
            <span className="text-lg font-bold ml-2">New Habit</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="bg-slate-800 rounded-2xl p-1 overflow-hidden">
                <div className="flex p-1 bg-slate-900/50 rounded-xl mb-4">
                    {(['daily', 'weekly', 'interval'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => handleFreqTypeChange(f)}
                            className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${frequencyType === f ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="px-4 pb-4 flex justify-center min-h-[60px] items-center w-full">
                    {frequencyType === 'daily' && (
                        <div className="flex justify-between w-full">
                            {WEEKDAYS.map((day, i) => (
                                <button
                                    key={i}
                                    onClick={() => toggleDay(i)}
                                    className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${frequencyDays.includes(i) ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-700 text-slate-400'}`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    )}
                    {frequencyType === 'weekly' && (
                        <div className="flex flex-col items-center w-full">
                            <div className="text-4xl font-bold text-white mb-1">{frequencyCount}</div>
                            <div className="text-xs text-slate-400 uppercase font-bold mb-4">Days per week</div>
                            <input 
                                type="range" min="1" max="7" 
                                value={frequencyCount} 
                                onChange={(e) => setFrequencyCount(Number(e.target.value))} 
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>
                    )}
                    {frequencyType === 'interval' && (
                        <div className="flex flex-col items-center w-full">
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-slate-400">Every</span>
                                <span className="text-4xl font-bold text-white">{frequencyCount}</span>
                                <span className="text-slate-400">Days</span>
                            </div>
                            <input 
                                type="range" min="1" max="30" 
                                value={frequencyCount} 
                                onChange={(e) => setFrequencyCount(Number(e.target.value))} 
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-700/50">
                <div onClick={() => setShowGoalModal(true)} className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <span className="font-medium text-slate-200">Goal</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">{targetValue ? `${targetValue} ${unit}` : 'Achieve it all'}</span>
                        {ArrowIcon}
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <span className="font-medium text-slate-200">Start Date</span>
                    <div className="flex items-center gap-2">
                         <span className="text-sm text-slate-500">{format(startDate, 'MMM d')}</span>
                         {ArrowIcon}
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <span className="font-medium text-slate-200">Goal Days</span>
                    <div className="flex items-center gap-2">
                         <span className="text-sm text-slate-500">{endDate ? format(endDate, 'MMM d, yyyy') : 'Forever'}</span>
                         {ArrowIcon}
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-200">Section</span>
                    <Plus size={16} className="text-slate-500"/>
                 </div>
                 <div className="grid grid-cols-4 gap-2">
                     {SECTIONS.map(s => (
                         <button 
                            key={s} 
                            onClick={() => setSection(s)}
                            className={`py-2 text-xs font-bold rounded-lg transition-colors ${section === s ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'}`}
                        >
                             {s}
                         </button>
                     ))}
                 </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-200">Reminder</span>
                    {reminders.length === 0 && <span className="text-sm text-slate-500">Off</span>}
                </div>
                {reminders.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {reminders.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold">
                                {r}
                                <X size={14} className="text-slate-400 cursor-pointer hover:text-white" onClick={() => removeReminder(i)} />
                            </div>
                        ))}
                    </div>
                )}
                <button onClick={addReminder} className="flex items-center gap-2 text-orange-500 text-sm font-bold mt-2 hover:text-orange-400">
                    <Plus size={16}/> Add Reminder
                </button>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 flex justify-between items-center">
                <span className="font-medium text-slate-200">Auto pop-up of habit log</span>
                <div className="w-12 h-6 bg-slate-600 rounded-full relative cursor-pointer">
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
            </div>

        </div>

        <div className="p-4 bg-slate-900">
             <button 
                 onClick={handleSave}
                 className="w-full py-3 bg-orange-500 text-white font-bold rounded-full shadow-lg hover:bg-orange-600 transition-colors"
             >
                 Save
             </button>
        </div>

        {showGoalModal && (
            <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in">
                <div className="bg-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-bold text-white">Goal</h3>
                        
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-700/50 rounded-lg">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!targetValue ? 'border-orange-500' : 'border-slate-500'}`}>
                                    {!targetValue && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"/>}
                                </div>
                                <span className={`font-medium ${!targetValue ? 'text-white' : 'text-slate-400'}`}>Achieve it all</span>
                                <input type="radio" checked={!targetValue} onChange={() => setTargetValue(undefined)} className="hidden"/>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-700/50 rounded-lg">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${targetValue ? 'border-orange-500' : 'border-slate-500'}`}>
                                    {targetValue && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"/>}
                                </div>
                                <span className={`font-medium ${targetValue ? 'text-white' : 'text-slate-400'}`}>Reach a certain amount</span>
                                <input type="radio" checked={!!targetValue} onChange={() => setTargetValue(1)} className="hidden"/>
                            </label>
                        </div>

                        {targetValue !== undefined && (
                            <div className="bg-slate-900 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2">
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs text-slate-500 font-bold">Daily</label>
                                        <input 
                                            type="number" 
                                            value={targetValue} 
                                            onChange={(e) => setTargetValue(Number(e.target.value))}
                                            className="w-full bg-slate-800 text-white p-2 rounded-lg outline-none border border-slate-700 focus:border-orange-500"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs text-slate-500 font-bold">Unit</label>
                                        <input 
                                            value={unit} 
                                            onChange={(e) => setUnit(e.target.value)}
                                            placeholder="Count"
                                            className="w-full bg-slate-800 text-white p-2 rounded-lg outline-none border border-slate-700 focus:border-orange-500"
                                        />
                                    </div>
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

export default HabitFormSheet;