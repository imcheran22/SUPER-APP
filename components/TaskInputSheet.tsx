import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Calendar, Flag, FolderInput, ArrowUp, X, Hash, Check, Sun, Moon, 
  CalendarDays, Bell, Repeat, Zap, ChevronLeft, ChevronRight, Clock,
  Timer
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
  
  // Time & Duration State
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  
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

  // Sync Start/End logic
  useEffect(() => {
      const start = parseInt(startHour) * 60 + parseInt(startMinute);
      const end = parseInt(endHour) * 60 + parseInt(endMinute);
      
      if (end <= start) {
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

  const durationText = useMemo(() => {
      const start = parseInt(startHour) * 60 + parseInt(startMinute);
      let end = parseInt(endHour) * 60 + parseInt(endMinute);
      if (end < start) end += 24 * 60; 
      
      const diff = end - start;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      
      if (h > 0 && m > 0) return `${h}h ${m}m`;
      if (h > 0) return `${h}h`;
      return `${m}m`;
  }, [startHour, startMinute, endHour, endMinute]);

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
          const startH = parseInt(startHour);
          const startM = parseInt(startMinute);
          finalDate = setHours(setMinutes(finalDate, startM), startH);

          const endH = parseInt(endHour);
          const endM = parseInt(endMinute);
          finalEndDate = setHours(setMinutes(finalDate, endM), endH);
          
          if (endH < startH || (endH === startH && endM < startM)) {
               finalEndDate = addDays(finalEndDate, 1);
          }
      }

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
      };

      onAddTask(newTask);
      onClose(); 
      setTimeout(() => resetState(), 300);
  };

  const togglePicker = (view: PickerView) => {
      if (activePicker === view) {
          setActivePicker('none');
      } else {
          setActivePicker(view);
          if (view === 'date') {
              if (!dueDate) {
                  const now = new Date();
                  setDueDate(now);
                  setCalendarMonth(now);
              } else {
                  setCalendarMonth(dueDate);
              }
          }
      }
  };

  const insertHash = () => {
    setTitle(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' #' : '#'));
    titleInputRef.current?.focus();
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

  const renderTimePicker = () => (
      <div className="flex flex-col h-full bg-slate-50">
          <div className="bg-white border-b border-slate-100 py-3 flex items-center justify-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Duration:</span>
              <span className="text-lg font-bold text-blue-600">{durationText}</span>
          </div>

          <div className="flex-1 flex divide-x divide-slate-200">
              <div className="flex-1 flex flex-col">
                  <div className="bg-slate-100 text-slate-500 text-xs font-bold uppercase py-2 text-center">Start Time</div>
                  <div className="flex-1 relative bg-white">
                       <div className="absolute inset-0 flex items-center justify-center gap-1">
                           <WheelPicker items={hours} selected={startHour} onSelect={setStartHour} />
                           <span className="text-xl font-bold text-slate-300">:</span>
                           <WheelPicker items={minutes} selected={startMinute} onSelect={setStartMinute} />
                       </div>
                  </div>
              </div>

              <div className="flex-1 flex flex-col">
                  <div className="bg-slate-100 text-slate-500 text-xs font-bold uppercase py-2 text-center">End Time</div>
                   <div className="flex-1 relative bg-white">
                       <div className="absolute inset-0 flex items-center justify-center gap-1">
                           <WheelPicker items={hours} selected={endHour} onSelect={setEndHour} />
                           <span className="text-xl font-bold text-slate-300">:</span>
                           <WheelPicker items={minutes} selected={endMinute} onSelect={setEndMinute} />
                       </div>
                  </div>
              </div>
          </div>
          
          <div className="p-3 bg-white border-t border-slate-100 flex justify-center">
               <button 
                  onClick={() => setIsAllDay(!isAllDay)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${isAllDay ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}
               >
                   {isAllDay ? "All Day Task" : "Specific Time"}
               </button>
          </div>
      </div>
  );

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
        <div className="flex-1 bg-white flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden h-[400px]">
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
                    <div className="grid grid-cols-4 gap-4 mb-8 mt-4">
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
                                                ${isSelected ? 'bg-blue-600 text-white shadow-md' : (isCurrentMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300')}
                                                ${isTodayDate && !isSelected ? 'text-blue-600 font-bold bg-blue-50' : ''}
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

            {dateTab === 'time' && renderTimePicker()}
        </div>
    );
  };

  const renderPriorityPicker = () => (
      <div className="bg-slate-50 p-4 border-t border-slate-100 animate-in slide-in-from-bottom">
          <div className="flex gap-2">
            {[Priority.None, Priority.Low, Priority.Medium, Priority.High].map(p => (
                <button
                    key={p}
                    onClick={() => { setPriority(p); setActivePicker('none'); }}
                    className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${priority === p ? 'bg-white border-blue-500 shadow-sm' : 'bg-white border-transparent hover:bg-slate-100'}`}
                >
                    <Flag size={20} className={
                        p === Priority.High ? 'text-red-500' : 
                        p === Priority.Medium ? 'text-yellow-500' : 
                        p === Priority.Low ? 'text-blue-500' : 'text-slate-400'
                    } fill={p !== Priority.None ? "currentColor" : "none"} />
                    <span className="text-xs font-bold text-slate-500">{Priority[p]}</span>
                </button>
            ))}
          </div>
      </div>
  );

  const renderListPicker = () => (
      <div className="bg-slate-50 p-4 border-t border-slate-100 animate-in slide-in-from-bottom">
        <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
            {allLists.map(l => (
                <button
                    key={l.id}
                    onClick={() => { setListId(l.id); setActivePicker('none'); }}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${listId === l.id ? 'bg-white border-blue-500 shadow-sm' : 'bg-white border-transparent hover:bg-slate-100'}`}
                >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="font-bold text-sm text-slate-700">{l.name}</span>
                </button>
            ))}
        </div>
      </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-android-bottom-sheet flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Input Area */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex gap-3">
             <button className="mt-1 flex-shrink-0 text-slate-300">
                 <Flag size={20} className={priority !== Priority.None ? 'text-blue-500' : ''} fill={priority !== Priority.None ? "currentColor" : "none"} />
             </button>
             <div className="flex-1">
                 <input 
                     ref={titleInputRef}
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="What would you like to do?"
                     className="w-full text-lg font-medium outline-none placeholder:text-slate-400 bg-transparent"
                     onKeyDown={(e) => {
                         if (e.key === 'Enter') handleAddTaskFn();
                     }}
                 />
                 {renderParsedChips()}
                 <textarea 
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     placeholder="Description"
                     className="w-full text-sm text-slate-500 outline-none placeholder:text-slate-300 bg-transparent resize-none h-6 mt-1"
                 />
             </div>
          </div>
          
          {selectedTags.length > 0 && (
             <div className="flex gap-2 pl-8 flex-wrap">
                 {selectedTags.map(tag => (
                     <span key={tag} className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-md font-medium flex items-center gap-1">
                         #{tag}
                         <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}><X size={12}/></button>
                     </span>
                 ))}
             </div>
          )}

          {/* Quick Toolbar */}
          <div className="flex items-center justify-between mt-2 pl-1">
              <div className="flex items-center gap-1">
                  {/* 1. CALENDAR ICON (Due Date) */}
                  <button 
                     onClick={() => togglePicker('date')} 
                     className={`p-2 rounded-lg transition-colors ${activePicker === 'date' || dueDate ? 'text-orange-500 bg-orange-50' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                      <Calendar size={20} />
                      {dueDate && <span className="text-xs font-bold ml-1">{format(dueDate, 'MMM d')}</span>}
                  </button>
                  
                  {/* 2. FLAG ICON (Priority) */}
                  <button 
                     onClick={() => togglePicker('priority')} 
                     className={`p-2 rounded-lg transition-colors ${activePicker === 'priority' || priority !== Priority.None ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                      <Flag 
                          size={20} 
                          className={priority === Priority.High ? 'text-red-500' : priority === Priority.Medium ? 'text-yellow-500' : priority === Priority.Low ? 'text-blue-500' : 'text-slate-400'} 
                          fill={priority !== Priority.None ? "currentColor" : "none"} 
                      />
                  </button>
                  
                  {/* 3. HASH ICON (Tags / "Ash") */}
                  <button 
                     onClick={insertHash}
                     className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                      <Hash size={20} />
                  </button>
                  
                  {/* 4. LIST SELECTOR (Folder Concept) */}
                  <button 
                     onClick={() => togglePicker('list')} 
                     className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${activePicker === 'list' ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentList.color }} />
                      <span className="text-xs font-bold text-slate-600 max-w-[80px] truncate">{currentList.name}</span>
                  </button>
              </div>

              <button 
                  onClick={handleAddTaskFn}
                  disabled={!title && !parsedData}
                  className="p-2.5 rounded-full bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-400 shadow-md transition-all active:scale-95"
              >
                  <ArrowUp size={20} strokeWidth={3} />
              </button>
          </div>
        </div>

        {/* Expanded Pickers Area */}
        <div className="transition-all duration-300 ease-in-out overflow-hidden bg-slate-50 border-t border-slate-100">
           {activePicker === 'date' && renderDatePicker()}
           {activePicker === 'priority' && renderPriorityPicker()}
           {activePicker === 'list' && renderListPicker()}
        </div>

      </div>
    </>
  );
};

export default TaskInputSheet;