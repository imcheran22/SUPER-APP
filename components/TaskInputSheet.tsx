import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Flag, ArrowUp, X, Hash, Check, Sun, Moon, 
  CalendarDays, Bell, Repeat, Zap, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Task, Priority, List } from '../types';
import { 
  format, addDays, nextMonday, isSameDay, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, 
  setHours, setMinutes, isToday, addMinutes, isSameMonth, differenceInMinutes
} from 'date-fns';
import { parseSmartInput } from '../services/nlpService';
import { WheelPicker } from './WheelPicker';

interface TaskInputSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Task) => void;
  lists: List[];
  initialConfig?: Partial<Task>;
}

type PickerView = 'none' | 'date' | 'priority' | 'list'; 

const TaskInputSheet: React.FC<TaskInputSheetProps> = ({ isOpen, onClose, onAddTask, lists, initialConfig }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activePicker, setActivePicker] = useState<PickerView>('none');
  
  const [priority, setPriority] = useState<Priority>(Priority.None);
  const [listId, setListId] = useState<string>('inbox');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  
  // Time State
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end'>('start');
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [parsedData, setParsedData] = useState<any>(null);
  
  const [reminder, setReminder] = useState<string>('None'); 
  const [repeat, setRepeat] = useState<string>('None');
  const [isAllDay, setIsAllDay] = useState(false);

  const [dateTab, setDateTab] = useState<'date' | 'time'>('date');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const titleInputRef = useRef<HTMLInputElement>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleInputRef.current?.focus(), 150);
      
      if (initialConfig) {
          if (initialConfig.listId) setListId(initialConfig.listId);
          if (initialConfig.priority !== undefined) setPriority(initialConfig.priority);
          if (initialConfig.dueDate) {
              setDueDate(initialConfig.dueDate);
              if (!initialConfig.isAllDay) {
                  setStartHour(format(initialConfig.dueDate, 'HH'));
                  setStartMinute(format(initialConfig.dueDate, 'mm'));
                  // Default end time to 1 hour later
                  const end = addMinutes(initialConfig.dueDate, 60);
                  setEndHour(format(end, 'HH'));
                  setEndMinute(format(end, 'mm'));
              }
          }
          if (initialConfig.isAllDay !== undefined) setIsAllDay(initialConfig.isAllDay);
      } else {
          resetState();
      }
    }
  }, [isOpen, initialConfig]);

  // Sync Start/End logic: If start moves past end, push end.
  useEffect(() => {
      const start = parseInt(startHour) * 60 + parseInt(startMinute);
      const end = parseInt(endHour) * 60 + parseInt(endMinute);
      
      if (end <= start) {
          // If end is before start, automatically adjust end to be start + 1 hour (wrapping around 24h if needed)
          const newEndTotal = (start + 60) % 1440;
          const newEndH = Math.floor(newEndTotal / 60);
          const newEndM = newEndTotal % 60;
          setEndHour(newEndH.toString().padStart(2, '0'));
          setEndMinute(newEndM.toString().padStart(2, '0'));
      }
  }, [startHour, startMinute]);

  useEffect(() => {
    if (!title) {
        setParsedData(null);
        return;
    }
    const result = parseSmartInput(title);
    if (result.dueDate || result.priority !== undefined || result.tags.length > 0) {
        setParsedData(result);
    } else {
        setParsedData(null);
    }
  }, [title]);

  const resetState = () => {
      setTitle('');
      setDescription('');
      setPriority(Priority.None);
      setListId('inbox');
      setDueDate(undefined);
      
      // Reset time to next hour
      const now = new Date();
      now.setMinutes(0);
      now.setHours(now.getHours() + 1);
      setStartHour(now.getHours().toString().padStart(2, '0'));
      setStartMinute('00');
      
      const next = addMinutes(now, 60);
      setEndHour(next.getHours().toString().padStart(2, '0'));
      setEndMinute('00');
      
      setReminder('None');
      setRepeat('None');
      setIsAllDay(false);
      setSelectedTags([]);
      setActivePicker('none');
      setDateTab('date');
      setCalendarMonth(new Date());
      setParsedData(null);
  };

  const updateTime = (h: string, m: string) => {
      if (activeTimeField === 'start') {
          setStartHour(h);
          setStartMinute(m);
      } else {
          setEndHour(h);
          setEndMinute(m);
      }
  };

  const handleAddTaskFn = () => {
      const finalTitle = parsedData ? parsedData.cleanTitle : title;
      if (!finalTitle.trim()) return;

      let finalDate = dueDate;
      let finalPriority = priority;
      let finalTags = selectedTags;
      let finalIsAllDay = isAllDay;

      if (parsedData) {
          if (parsedData.dueDate) finalDate = parsedData.dueDate;
          if (parsedData.priority !== undefined) finalPriority = parsedData.priority;
          if (parsedData.tags.length > 0) {
              const combined = new Set([...finalTags, ...parsedData.tags]);
              finalTags = Array.from(combined);
          }
          finalIsAllDay = parsedData.isAllDay;
      }

      let finalEndDate: Date | undefined = undefined;

      if (finalDate && !finalIsAllDay) {
          // Set Start Time
          const startH = parseInt(startHour);
          const startM = parseInt(startMinute);
          finalDate = setHours(setMinutes(finalDate, startM), startH);

          // Set End Time
          const endH = parseInt(endHour);
          const endM = parseInt(endMinute);
          finalEndDate = setHours(setMinutes(finalDate, endM), endH);
          
          // Handle overflow to next day if end time is numerically smaller than start time (e.g. 11PM to 1AM)
          if (endH < startH || (endH === startH && endM < startM)) {
               finalEndDate = addDays(finalEndDate, 1);
          }
      }

      // Calculate duration for compatibility
      let duration = 60;
      if (finalDate && finalEndDate) {
          duration = differenceInMinutes(finalEndDate, finalDate);
      }

      const newTask: Task = {
          id: Date.now().toString(),
          title: finalTitle,
          description: description.trim(),
          isCompleted: false,
          priority: finalPriority,
          listId,
          tags: finalTags,
          dueDate: finalDate,
          endDate: finalEndDate,
          duration: duration,
          isAllDay: finalIsAllDay,
          subtasks: [],
          attachments: [],
          reminder: reminder !== 'None' ? new Date() : undefined, 
          repeat: repeat !== 'None' ? repeat : undefined,
          createdAt: new Date(),
      };

      onAddTask(newTask);
      onClose(); 
      setTimeout(() => resetState(), 300);
  };

  const togglePicker = (view: PickerView) => {
      setActivePicker(activePicker === view ? 'none' : view);
      if (view === 'date' && activePicker !== 'date') {
          if (!dueDate) setDueDate(new Date());
          setCalendarMonth(dueDate || new Date());
      }
  };

  const insertHash = () => {
    setTitle(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' #' : '#'));
    titleInputRef.current?.focus();
  };

  const getPriorityIcon = (p: Priority) => {
      const color = p === Priority.High ? 'text-red-500' : p === Priority.Medium ? 'text-yellow-500' : p === Priority.Low ? 'text-blue-500' : 'text-slate-400';
      return <Flag size={20} className={color} fill={p !== Priority.None ? "currentColor" : "none"} />;
  };

  const getPriorityColorClass = (p: Priority) => {
      switch (p) {
          case Priority.High: return 'text-red-500';
          case Priority.Medium: return 'text-yellow-500';
          case Priority.Low: return 'text-blue-500';
          default: return 'text-slate-500';
      }
  };

  const allLists = [{ id: 'inbox', name: 'Inbox', color: '#3b82f6' }, ...lists];
  const currentList = allLists.find(l => l.id === listId) || allLists[0];

  const renderParsedChips = () => {
      if (!parsedData) return null;
      return (
          <div className="flex gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2">
              {parsedData.dueDate && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-600 flex items-center gap-1 border border-orange-200">
                      <Zap size={10} fill="currentColor"/> {format(parsedData.dueDate, 'MMM d')}
                  </span>
              )}
              {parsedData.priority !== undefined && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 flex items-center gap-1 border border-red-200">
                      <Zap size={10} fill="currentColor"/> Priority {parsedData.priority}
                  </span>
              )}
              {parsedData.tags.map((t: string) => (
                  <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-600 border border-blue-200">
                      #{t}
                  </span>
              ))}
          </div>
      );
  };

  const renderDatePicker = () => {
    const today = new Date();
    const calendarDays = eachDayOfInterval({
        start: startOfWeek(startOfMonth(calendarMonth)),
        end: endOfWeek(endOfMonth(calendarMonth))
    });

    const setQuickDate = (d: Date) => {
        setDueDate(d);
        setCalendarMonth(d);
    };

    return (
        <div className="flex-1 bg-white flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 border-b border-slate-50">
                 <button onClick={() => togglePicker('none')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600"><X size={24}/></button>
                 <div className="flex gap-6 font-bold text-sm">
                     <button onClick={() => setDateTab('date')} className={`pb-2 border-b-2 transition-colors ${dateTab === 'date' ? 'border-orange-500 text-slate-800' : 'border-transparent text-slate-400'}`}>Date</button>
                     <button onClick={() => setDateTab('time')} className={`pb-2 border-b-2 transition-colors ${dateTab === 'time' ? 'border-orange-500 text-slate-800' : 'border-transparent text-slate-400'}`}>Time</button>
                 </div>
                 <button onClick={() => togglePicker('none')} className="p-2 -mr-2 text-blue-500 hover:text-blue-600"><Check size={24}/></button>
            </div>

            {dateTab === 'date' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                    <div className="grid grid-cols-4 gap-4 mb-8 mt-2">
                        <button onClick={() => setQuickDate(today)} className="flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex flex-col items-center justify-center text-orange-500 border border-orange-100 group-hover:bg-orange-100 transition-colors">
                                <span className="text-[9px] font-bold uppercase mt-0.5">{format(today, 'MMM')}</span>
                                <span className="text-sm font-bold -mt-0.5">{format(today, 'd')}</span>
                            </div>
                            <span className="text-xs font-medium text-slate-600">Today</span>
                        </button>
                        <button onClick={() => setQuickDate(addDays(today, 1))} className="flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-orange-500 border border-slate-100 group-hover:bg-slate-100 transition-colors">
                                <Sun size={20} />
                            </div>
                            <span className="text-xs font-medium text-slate-600">Tomorrow</span>
                        </button>
                        <button onClick={() => setQuickDate(nextMonday(today))} className="flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-orange-500 border border-slate-100 group-hover:bg-slate-100 transition-colors">
                                <CalendarDays size={20} />
                            </div>
                            <span className="text-xs font-medium text-slate-600">Next Mon</span>
                        </button>
                        <button onClick={() => {
                                const tonight = setHours(setMinutes(new Date(), 0), 20);
                                setDueDate(tonight);
                                setStartHour('20');
                                setStartMinute('00');
                                setEndHour('21');
                                setEndMinute('00');
                            }} className="flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-orange-500 border border-slate-100 group-hover:bg-slate-100 transition-colors">
                                <Moon size={20} />
                            </div>
                            <span className="text-xs font-medium text-slate-600">Tonight</span>
                        </button>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="text-lg font-bold text-slate-800">{format(calendarMonth, 'MMMM yyyy')}</span>
                            <div className="flex gap-1">
                                <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronLeft size={20}/></button>
                                <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronRight size={20}/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 text-center mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1">
                            {calendarDays.map((day, idx) => {
                                const isCurrentMonth = isSameMonth(day, calendarMonth);
                                const isSelected = dueDate && isSameDay(day, dueDate);
                                const isTodayDate = isToday(day);
                                return (
                                    <div key={idx} className="flex justify-center">
                                        <button
                                            onClick={() => setDueDate(day)}
                                            className={`
                                                w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                                ${isSelected ? 'bg-orange-500 text-white shadow-md' : isTodayDate ? 'text-orange-500 bg-orange-50' : isCurrentMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300'}
                                            `}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {dateTab === 'time' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                    <div className="p-4 space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                             <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date</span>
                                <span className="text-lg font-bold text-slate-800">{dueDate ? format(dueDate, 'EEE, MMM d') : format(new Date(), 'EEE, MMM d')}</span>
                             </div>
                             <button 
                                onClick={() => setIsAllDay(!isAllDay)}
                                className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${isAllDay ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                             >
                                 All Day
                             </button>
                        </div>
                        
                        {!isAllDay && (
                            <div className="flex gap-2">
                                {/* Start Time Button */}
                                <button 
                                    onClick={() => setActiveTimeField('start')}
                                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${activeTimeField === 'start' ? 'border-orange-500 bg-white shadow-md' : 'border-transparent bg-white shadow-sm'}`}
                                >
                                    <span className="text-xs font-bold text-slate-400 uppercase">Start</span>
                                    <span className="text-2xl font-bold text-slate-800">{startHour}:{startMinute}</span>
                                </button>
                                
                                <div className="flex items-center text-slate-300"><ChevronRight /></div>

                                {/* End Time Button */}
                                <button 
                                    onClick={() => setActiveTimeField('end')}
                                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${activeTimeField === 'end' ? 'border-orange-500 bg-white shadow-md' : 'border-transparent bg-white shadow-sm'}`}
                                >
                                    <span className="text-xs font-bold text-slate-400 uppercase">End</span>
                                    <span className="text-2xl font-bold text-slate-800">{endHour}:{endMinute}</span>
                                </button>
                            </div>
                        )}

                        {!isAllDay && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex justify-center items-center gap-2 h-48 relative overflow-hidden">
                                 <WheelPicker 
                                    items={hours} 
                                    selected={activeTimeField === 'start' ? startHour : endHour} 
                                    onSelect={(h) => updateTime(h, activeTimeField === 'start' ? startMinute : endMinute)} 
                                 />
                                 <span className="text-2xl font-bold text-slate-300 pb-2">:</span>
                                 <WheelPicker 
                                    items={minutes} 
                                    selected={activeTimeField === 'start' ? startMinute : endMinute} 
                                    onSelect={(m) => updateTime(activeTimeField === 'start' ? startHour : endHour, m)} 
                                 />
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                             <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                 <div className="flex items-center gap-3">
                                     <Bell size={20} className="text-slate-400" />
                                     <span className="font-medium text-slate-700">Reminder</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <span className="text-orange-500 font-medium text-sm">{reminder}</span>
                                     {reminder !== 'None' ? (
                                         <button onClick={(e) => { e.stopPropagation(); setReminder('None'); }}><X size={16} className="text-slate-300 hover:text-red-500"/></button>
                                     ) : (
                                        <button onClick={() => setReminder('On time')} className="text-slate-300"><ChevronRight size={16} /></button>
                                     )}
                                 </div>
                             </div>
                             <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                 <div className="flex items-center gap-3">
                                     <Repeat size={20} className="text-slate-400" />
                                     <span className="font-medium text-slate-700">Repeat</span>
                                 </div>
                                 <div className="flex items-center gap-1 text-slate-400">
                                     <span className="text-sm font-medium">{repeat}</span>
                                     <ChevronRight size={16} />
                                 </div>
                             </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
        <div className="fixed inset-0 bg-black/40 z-50 transition-opacity" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Parsed Chips */}
            <div className="px-4 pt-4">
                {renderParsedChips()}
            </div>

            {/* Main Input Area */}
            <div className="p-4 flex gap-3">
                 <button className="mt-1 text-slate-400 hover:text-blue-500 transition-colors">
                     <Check className="w-6 h-6 rounded-full border-2 border-slate-300 p-0.5" />
                 </button>
                 <div className="flex-1">
                     <input 
                         ref={titleInputRef}
                         value={title}
                         onChange={(e) => setTitle(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleAddTaskFn()}
                         placeholder="What would you like to do?"
                         className="w-full text-lg font-medium outline-none placeholder-slate-400 bg-transparent"
                     />
                     <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description"
                        rows={1}
                        className="w-full text-sm text-slate-500 outline-none placeholder-slate-300 bg-transparent mt-1 resize-none h-auto min-h-[20px]"
                     />
                 </div>
            </div>

            {/* Toolbar */}
            <div className="px-2 pb-2">
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2">
                     <div className="flex items-center gap-1">
                         <button 
                            onClick={() => togglePicker('date')} 
                            className={`p-2 rounded-lg transition-colors ${activePicker === 'date' || dueDate ? 'text-orange-500 bg-orange-50' : 'text-slate-500 hover:bg-slate-200'}`}
                         >
                             <Calendar size={20} />
                             {dueDate && <span className="text-xs font-bold ml-1">{format(dueDate, 'MMM d')}</span>}
                         </button>
                         <button 
                            onClick={() => togglePicker('priority')} 
                            className={`p-2 rounded-lg transition-colors ${activePicker === 'priority' || priority !== Priority.None ? 'bg-slate-200' : 'text-slate-500 hover:bg-slate-200'}`}
                         >
                             {getPriorityIcon(priority)}
                         </button>
                         <button 
                            onClick={insertHash}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
                         >
                             <Hash size={20} />
                         </button>
                         <button 
                            onClick={() => togglePicker('list')} 
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors flex items-center gap-1"
                         >
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentList.color }} />
                             <span className="text-xs font-bold text-slate-600 max-w-[80px] truncate">{currentList.name}</span>
                         </button>
                     </div>
                     <button 
                        onClick={handleAddTaskFn}
                        disabled={!title.trim()}
                        className="w-10 h-10 bg-blue-600 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center shadow-sm hover:bg-blue-700 transition-all active:scale-95"
                     >
                         <ArrowUp size={20} strokeWidth={3} />
                     </button>
                </div>
            </div>

            {/* Active Picker Content */}
            {activePicker !== 'none' && (
                <div className="h-[350px] border-t border-slate-100 flex flex-col">
                    {activePicker === 'date' && renderDatePicker()}
                    
                    {activePicker === 'priority' && (
                        <div className="flex-1 bg-white p-4 animate-in slide-in-from-bottom duration-300">
                             <div className="flex justify-between items-center mb-4">
                                 <span className="font-bold text-slate-400 text-sm uppercase">Select Priority</span>
                                 <button onClick={() => togglePicker('none')}><X size={20} className="text-slate-400"/></button>
                             </div>
                             <div className="grid grid-cols-4 gap-3">
                                 {[Priority.High, Priority.Medium, Priority.Low, Priority.None].map(p => (
                                     <button
                                         key={p}
                                         onClick={() => { setPriority(p); togglePicker('none'); }}
                                         className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${priority === p ? 'border-current bg-slate-50' : 'border-slate-100 hover:bg-slate-50'}`}
                                         style={{ color: p === Priority.None ? '#94a3b8' : undefined }}
                                     >
                                         <div className={`${getPriorityColorClass(p)}`}>
                                             <Flag size={24} fill="currentColor" />
                                         </div>
                                         <span className={`text-xs font-bold ${getPriorityColorClass(p)}`}>{Priority[p]}</span>
                                     </button>
                                 ))}
                             </div>
                        </div>
                    )}

                    {activePicker === 'list' && (
                         <div className="flex-1 bg-white p-4 animate-in slide-in-from-bottom duration-300 flex flex-col">
                             <div className="flex justify-between items-center mb-4 shrink-0">
                                 <span className="font-bold text-slate-400 text-sm uppercase">Select List</span>
                                 <button onClick={() => togglePicker('none')}><X size={20} className="text-slate-400"/></button>
                             </div>
                             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                 {allLists.map(list => (
                                     <button
                                         key={list.id}
                                         onClick={() => { setListId(list.id); togglePicker('none'); }}
                                         className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${listId === list.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                     >
                                         <div className="w-4 h-4 rounded-full" style={{ backgroundColor: list.color }} />
                                         <span className={`flex-1 text-left font-medium ${listId === list.id ? 'text-blue-700' : 'text-slate-700'}`}>{list.name}</span>
                                         {listId === list.id && <Check size={18} className="text-blue-600" />}
                                     </button>
                                 ))}
                             </div>
                         </div>
                    )}
                </div>
            )}
        </div>
    </>
  );
};

export default TaskInputSheet;