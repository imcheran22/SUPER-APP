import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Priority, List, Subtask, TaskLocation } from '../types';
import { 
  X, 
  Calendar as CalendarIcon, 
  Flag, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Repeat,
  Tag,
  MapPin,
  Paperclip,
  Plus,
  ChevronRight,
  Clock,
  MoreVertical,
  Share2,
  Zap,
  CheckSquare,
  Sun,
  Moon,
  CalendarDays,
  Check,
  Hash,
  ArrowUp,
  Edit2,
  Pin,
  XCircle,
  Link,
  FileText,
  Activity,
  Search,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  CornerDownRight
} from 'lucide-react';
import { 
    format, isBefore, startOfDay, addDays, nextMonday, 
    startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, 
    endOfMonth, isSameMonth, isToday, setHours, setMinutes, addMinutes, isSameDay
} from 'date-fns';
import { WheelPicker } from './WheelPicker';
import { parseSmartInput } from '../services/nlpService';
import { generateSubtasks } from '../services/aiService';

interface TaskDetailViewProps {
  task: Task;
  lists: List[];
  tasks?: Task[]; // Add this prop to access other tasks
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void; 
  onStartFocus?: (taskId: string) => void;
  onPermanentDelete?: (taskId: string) => void;
  onLinkTask?: (childId: string, parentId: string) => void;
}

const TaskDetailView: React.FC<TaskDetailViewProps> = ({ 
    task, lists, tasks = [], onClose, onUpdateTask, onDeleteTask, onStartFocus, onPermanentDelete, onLinkTask 
}) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  
  // Subtask Editing State
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  
  // New/Edit Subtask Input State
  const [subtaskTitleInput, setSubtaskTitleInput] = useState('');
  const [subtaskPriority, setSubtaskPriority] = useState<Priority>(Priority.None);
  const [subtaskDueDate, setSubtaskDueDate] = useState<Date | undefined>(undefined);
  const [subtaskIsAllDay, setSubtaskIsAllDay] = useState(true);
  const [activeSubtaskPicker, setActiveSubtaskPicker] = useState<'none' | 'date'>('none');
  const [subtaskDateTab, setSubtaskDateTab] = useState<'date' | 'time'>('date');
  const [isSubtaskInputFocused, setIsSubtaskInputFocused] = useState(false);
  
  // AI State
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);

  // Main Task States
  const [showOptions, setShowOptions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateTab, setDateTab] = useState<'date' | 'time'>('date');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // Link Parent Task State
  const [isLinkingParent, setIsLinkingParent] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState('');

  // Location State
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationName, setLocationName] = useState(task.location?.name || '');
  
  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Time Picker State
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  // Sync state if task prop changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setDueDate(task.dueDate);
    if (JSON.stringify(task.subtasks) !== JSON.stringify(subtasks)) {
         setSubtasks(task.subtasks || []);
    }
    setLocationName(task.location?.name || '');
  }, [task.id]); 

  const handleSave = (updatedFields: Partial<Task> = {}) => {
    onUpdateTask({
      ...task,
      title,
      description,
      priority,
      dueDate,
      subtasks,
      ...updatedFields
    });
  };

  const handleTitleBlur = () => handleSave({ title });
  const handleDescBlur = () => handleSave({ description });

  useEffect(() => {
    if (JSON.stringify(subtasks) !== JSON.stringify(task.subtasks)) {
        onUpdateTask({ ...task, subtasks });
    }
  }, [subtasks]);

  const saveSubtask = () => {
    // Smart Parsing
    let finalTitle = subtaskTitleInput;
    let finalPriority = subtaskPriority;
    let finalDate = subtaskDueDate;
    let finalIsAllDay = subtaskIsAllDay;
    let finalTags: string[] = [];

    if (subtaskTitleInput.trim()) {
        const result = parseSmartInput(subtaskTitleInput);
        finalTitle = result.cleanTitle;
        if (result.priority !== undefined && subtaskPriority === Priority.None) finalPriority = result.priority;
        if (result.dueDate && !subtaskDueDate) {
            finalDate = result.dueDate;
            finalIsAllDay = result.isAllDay;
        }
        if (result.tags.length > 0) finalTags = result.tags;
    }

    if (!finalTitle.trim()) return;

    if (editingSubtaskId) {
        // Update Existing
        const updatedSubtasks = subtasks.map(s => {
            if (s.id === editingSubtaskId) {
                return {
                    ...s,
                    title: finalTitle,
                    priority: finalPriority,
                    dueDate: finalDate,
                    isAllDay: finalIsAllDay,
                    tags: finalTags
                };
            }
            return s;
        });
        setSubtasks(updatedSubtasks);
        setEditingSubtaskId(null);
    } else {
        // Create New
        const newSubtask: Subtask = {
            id: Date.now().toString(),
            title: finalTitle,
            isCompleted: false,
            priority: finalPriority,
            dueDate: finalDate,
            isAllDay: finalIsAllDay,
            tags: finalTags
        };
        setSubtasks([...subtasks, newSubtask]);
    }
    
    // Reset Input State
    resetSubtaskInput();
  };

  const resetSubtaskInput = () => {
      setSubtaskTitleInput('');
      setSubtaskPriority(Priority.None);
      setSubtaskDueDate(undefined);
      setSubtaskIsAllDay(true);
      setActiveSubtaskPicker('none');
      setSubtaskDateTab('date');
      setEditingSubtaskId(null);
  };

  const handleAiSubtasks = async () => {
      setIsGeneratingSubtasks(true);
      try {
          const suggestions = await generateSubtasks(title);
          const newSubtasks: Subtask[] = suggestions.map((t, i) => ({
              id: Date.now().toString() + i,
              title: t,
              isCompleted: false
          }));
          
          setSubtasks([...subtasks, ...newSubtasks]);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingSubtasks(false);
      }
  };

  const startEditingSubtask = (st: Subtask) => {
      setEditingSubtaskId(st.id);
      setSubtaskTitleInput(st.title);
      setSubtaskPriority(st.priority || Priority.None);
      setSubtaskDueDate(st.dueDate ? new Date(st.dueDate) : undefined);
      setSubtaskIsAllDay(st.isAllDay !== undefined ? st.isAllDay : true);
      setIsSubtaskInputFocused(true);
  };

  const toggleSubtask = (id: string) => {
    const updatedSubtasks = subtasks.map(st => st.id === id ? { ...st, isCompleted: !st.isCompleted } : st);
    setSubtasks(updatedSubtasks);
  };

  const deleteSubtask = (id: string) => {
      setSubtasks(subtasks.filter(s => s.id !== id));
      if (editingSubtaskId === id) resetSubtaskInput();
  }

  const updateDate = (d: Date, isSubtask = false) => {
      let newDate = d;
      // Preserve time if modifying existing
      const current = isSubtask ? subtaskDueDate : dueDate;
      if (current) {
          newDate = setHours(setMinutes(d, current.getMinutes()), current.getHours());
      }
      
      if (isSubtask) {
          setSubtaskDueDate(newDate);
          // Keep picker open to switch tabs if needed, or close? 
          // Usually close if clicking date in day view.
          // setActiveSubtaskPicker('none'); 
      } else {
          setDueDate(newDate);
          onUpdateTask({ ...task, dueDate: newDate });
          setShowDatePicker(false);
      }
  };

  const updateTime = (h: string, m: string, isSubtask = false) => {
      if (isSubtask) {
        setSelectedHour(h);
        setSelectedMinute(m);
        if (subtaskDueDate) {
            const newDate = setHours(setMinutes(subtaskDueDate, parseInt(m)), parseInt(h));
            setSubtaskDueDate(newDate);
            setSubtaskIsAllDay(false);
        } else {
            // If no date selected, assume today
            const today = new Date();
            const newDate = setHours(setMinutes(today, parseInt(m)), parseInt(h));
            setSubtaskDueDate(newDate);
            setSubtaskIsAllDay(false);
        }
      } else {
        setSelectedHour(h);
        setSelectedMinute(m);
        if (dueDate) {
            const newDate = setHours(setMinutes(dueDate, parseInt(m)), parseInt(h));
            setDueDate(newDate);
            onUpdateTask({ ...task, dueDate: newDate, isAllDay: false });
        }
      }
  };

  const handleLocationSave = () => {
      if (locationName.trim()) {
          onUpdateTask({ ...task, location: { name: locationName } });
      } else {
          onUpdateTask({ ...task, location: undefined });
      }
      setShowLocationInput(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              const newAttachment = {
                  id: Date.now().toString(),
                  title: file.name,
                  type: 'image' as const,
                  url: base64String
              };
              onUpdateTask({
                  ...task,
                  attachments: [...(task.attachments || []), newAttachment]
              });
          };
          reader.readAsDataURL(file);
      }
  };

  const currentList = lists.find(l => l.id === task.listId);
  
  const getDateText = (date?: Date, isAllDay = false) => {
      if (!date) return null;
      const now = new Date();
      let text = format(date, 'd MMM yyyy');
      
      if (!isAllDay) {
          text += `, ${format(date, 'HH:mm')}`;
      }

      if (isBefore(date, startOfDay(now)) && !task.isCompleted) {
           return <span className="text-red-500 font-medium">{text}</span>;
      }
      
      return <span className="text-slate-500 font-medium">{text}</span>;
  };

  const getPriorityColor = (p: Priority) => {
      switch (p) {
          case Priority.High: return 'text-red-500';
          case Priority.Medium: return 'text-yellow-500';
          case Priority.Low: return 'text-blue-500';
          default: return 'text-slate-400';
      }
  };

  // --- Search Logic for Linking Parent ---
  const filteredParentTasks = useMemo(() => {
      if (!isLinkingParent) return [];
      const query = parentSearchQuery.toLowerCase();
      return tasks.filter(t => 
          t.id !== task.id && // Exclude self
          !t.isDeleted && // Exclude deleted
          (t.title.toLowerCase().includes(query) || (t.description || '').toLowerCase().includes(query))
      ).slice(0, 20); // Limit to top 20 matches
  }, [tasks, task.id, parentSearchQuery, isLinkingParent]);

  // --- Renderers for Date Picker ---
  const renderCalendar = (isSubtask = false) => {
      const today = new Date();
      const calendarDays = eachDayOfInterval({
          start: startOfWeek(startOfMonth(calendarMonth)),
          end: endOfWeek(endOfMonth(calendarMonth))
      });

      return (
          <div className="p-4 space-y-4">
              <div className="flex justify-between gap-2 overflow-x-auto pb-2 no-scrollbar">
                  <button onClick={() => updateDate(today, isSubtask)} className="flex flex-col items-center gap-1 p-2 bg-blue-50 rounded-lg min-w-[70px]">
                      <Sun size={20} className="text-blue-500"/>
                      <span className="text-xs font-bold text-blue-700">Today</span>
                  </button>
                  <button onClick={() => updateDate(addDays(today, 1), isSubtask)} className="flex flex-col items-center gap-1 p-2 bg-orange-50 rounded-lg min-w-[70px]">
                      <Sun size={20} className="text-orange-500"/>
                      <span className="text-xs font-bold text-orange-700">Tmrw</span>
                  </button>
                  <button onClick={() => updateDate(nextMonday(today), isSubtask)} className="flex flex-col items-center gap-1 p-2 bg-purple-50 rounded-lg min-w-[70px]">
                      <CalendarDays size={20} className="text-purple-500"/>
                      <span className="text-xs font-bold text-purple-700">Next Wk</span>
                  </button>
              </div>

              <div>
                  <div className="flex items-center justify-between mb-4">
                      <span className="font-bold text-lg">{format(calendarMonth, 'MMMM yyyy')}</span>
                  </div>
                  <div className="grid grid-cols-7 text-center text-xs text-slate-400 font-bold mb-2">
                      {['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-y-1">
                      {calendarDays.map((day, i) => {
                          const isCurrent = isSameMonth(day, calendarMonth);
                          const targetDate = isSubtask ? subtaskDueDate : dueDate;
                          const isSelected = targetDate && isSameDay(day, targetDate);
                          
                          return (
                              <button 
                                key={i} 
                                onClick={() => updateDate(day, isSubtask)}
                                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isSelected ? 'bg-blue-600 text-white' : (isCurrent ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300')}`}
                              >
                                  {format(day, 'd')}
                              </button>
                          )
                      })}
                  </div>
              </div>
          </div>
      )
  };

  const renderTimePicker = (isSubtask = false) => (
      <div className="p-4 flex flex-col items-center justify-center gap-2 h-48">
           <div className="flex items-center justify-center gap-2">
                <WheelPicker items={hours} selected={selectedHour} onSelect={(h) => updateTime(h, selectedMinute, isSubtask)} />
                <span className="text-xl font-bold">:</span>
                <WheelPicker items={minutes} selected={selectedMinute} onSelect={(m) => updateTime(selectedHour, m, isSubtask)} />
           </div>
           {isSubtask && (
               <button 
                onClick={() => setSubtaskIsAllDay(!subtaskIsAllDay)} 
                className={`mt-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${subtaskIsAllDay ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}
               >
                   {subtaskIsAllDay ? "All Day" : "Specific Time"}
               </button>
           )}
      </div>
  );

  const SubtaskItem: React.FC<{ st: Subtask }> = ({ st }) => {
      if (editingSubtaskId === st.id) {
          // Render Input Form for this item
          return (
              <div className="bg-slate-50 rounded-xl border border-blue-200 shadow-sm ring-1 ring-blue-100 mt-2 mb-2">
                  {renderSubtaskInputArea()}
              </div>
          );
      }

      return (
          <div className="flex items-start gap-3 group py-2 hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer" onClick={() => startEditingSubtask(st)}>
              <button onClick={(e) => { e.stopPropagation(); toggleSubtask(st.id); }} className={`mt-0.5 text-slate-400 hover:text-blue-500 ${st.isCompleted ? 'text-blue-500' : ''}`}>
                  {st.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>
              <div className="flex-1 min-w-0">
                  <div className={`text-sm ${st.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {st.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {st.dueDate && (
                          <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 rounded flex items-center gap-1 border border-orange-100 font-medium">
                              <CalendarIcon size={10} /> 
                              {format(new Date(st.dueDate), 'MMM d')}
                              {!st.isAllDay && ` ${format(new Date(st.dueDate), 'HH:mm')}`}
                          </span>
                      )}
                      {!!st.priority && (
                          <span className={`text-[10px] px-1.5 rounded flex items-center gap-1 border ${getPriorityColor(st.priority)} border-current bg-white font-medium`}>
                              <Flag size={10} fill="currentColor" /> {Priority[st.priority]}
                          </span>
                      )}
                      {st.tags && st.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-blue-50 text-blue-500 px-1.5 rounded font-medium border border-blue-100">#{tag}</span>
                      ))}
                  </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteSubtask(st.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-opacity">
                  <X size={16} />
              </button>
          </div>
      );
  };

  const renderSubtaskInputArea = () => (
      <>
        <div className="flex items-center gap-3 p-3">
            <Plus size={18} className="text-slate-400" />
            <input 
                value={subtaskTitleInput}
                onChange={(e) => setSubtaskTitleInput(e.target.value)}
                onFocus={() => setIsSubtaskInputFocused(true)}
                autoFocus={!!editingSubtaskId}
                onKeyDown={(e) => { 
                    if (e.key === 'Enter') saveSubtask(); 
                    if (e.key === 'Escape') resetSubtaskInput();
                }}
                placeholder={isSubtaskInputFocused ? (editingSubtaskId ? "Edit subtask..." : "Type subtask...") : "Add subtask"}
                className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400"
            />
            {subtaskTitleInput && (
                <button onClick={saveSubtask} className="text-blue-500 bg-blue-100 p-1 rounded-full hover:bg-blue-200 transition-colors">
                    <ArrowUp size={16} />
                </button>
            )}
        </div>
        
        {/* Subtask Toolbar - Visible when focused or editing */}
        {(isSubtaskInputFocused || subtaskTitleInput || editingSubtaskId) && (
            <div className="flex items-center justify-between px-3 pb-2 animate-in slide-in-from-top-1">
                <div className="flex gap-1">
                    <button 
                    onClick={() => setActiveSubtaskPicker(activeSubtaskPicker === 'date' ? 'none' : 'date')}
                    className={`p-1.5 rounded-lg transition-colors ${subtaskDueDate || activeSubtaskPicker === 'date' ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:bg-slate-200'}`}
                    >
                        <CalendarIcon size={16} />
                        {subtaskDueDate && <span className="ml-1 text-[10px] font-bold">{format(subtaskDueDate, 'dd/MM')}</span>}
                    </button>
                    
                    <button 
                    onClick={() => setSubtaskPriority(prev => prev === Priority.High ? Priority.None : prev + 1)}
                    className={`p-1.5 rounded-lg transition-colors ${subtaskPriority !== Priority.None ? 'bg-slate-200' : 'text-slate-400 hover:bg-slate-200'}`}
                    >
                        <Flag size={16} className={subtaskPriority !== Priority.None ? getPriorityColor(subtaskPriority) : ''} fill={subtaskPriority !== Priority.None ? "currentColor" : "none"}/>
                    </button>
                    
                    <button 
                    onClick={() => setSubtaskTitleInput(prev => prev + " #")}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200"
                    >
                        <Hash size={16} />
                    </button>
                </div>
                {editingSubtaskId && (
                    <button onClick={resetSubtaskInput} className="text-xs text-slate-400 hover:text-slate-600 px-2">Cancel</button>
                )}
            </div>
        )}
        
        {/* Inline Calendar for Subtasks */}
        {activeSubtaskPicker === 'date' && (
            <div className="border-t border-slate-100 bg-white rounded-b-xl overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button onClick={() => setSubtaskDateTab('date')} className={`flex-1 py-2 text-xs font-bold ${subtaskDateTab === 'date' ? 'bg-white text-blue-600' : 'text-slate-500'}`}>Date</button>
                    <button onClick={() => setSubtaskDateTab('time')} className={`flex-1 py-2 text-xs font-bold ${subtaskDateTab === 'time' ? 'bg-white text-blue-600' : 'text-slate-500'}`}>Time</button>
                </div>
                {subtaskDateTab === 'date' ? renderCalendar(true) : renderTimePicker(true)}
            </div>
        )}
      </>
  );

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* 1. Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0 safe-pt">
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentList?.color || '#ccc' }} />
                 <span className="text-sm font-medium text-slate-700">{currentList?.name || 'Inbox'}</span>
             </div>
         </div>
         <div className="flex items-center gap-2">
             {task.isPinned && <Pin size={20} className="text-blue-500 mr-2 rotate-45" fill="currentColor" />}
             <button onClick={() => setShowOptions(!showOptions)} className={`p-2 rounded-full transition-colors relative ${showOptions ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}>
                 <MoreVertical size={22} />
             </button>
             <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                 <X size={24} />
             </button>
         </div>
      </div>

      {/* Options Menu - Bottom Sheet Style */}
      {showOptions && (
          <div className="absolute inset-0 z-50 bg-black/20 flex flex-col justify-end animate-in fade-in" onClick={() => setShowOptions(false)}>
              <div className="bg-white rounded-t-2xl shadow-2xl p-4 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-center mb-4">
                      <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                  </div>
                  
                  {/* Top Row Icons */}
                  <div className="grid grid-cols-4 gap-2 mb-6 border-b border-slate-100 pb-6">
                      <button 
                        onClick={() => { handleSave({ isPinned: !task.isPinned }); setShowOptions(false); }}
                        className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-slate-50 active:scale-95 transition-all"
                      >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${task.isPinned ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                              <Pin size={22} fill={task.isPinned ? "currentColor" : "none"} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">Pin</span>
                      </button>
                      
                      <button className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-slate-50 active:scale-95 transition-all">
                          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xl">
                              <Share2 size={22} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">Share</span>
                      </button>
                      
                      <button 
                         onClick={() => { handleSave({ isWontDo: !task.isWontDo }); setShowOptions(false); }}
                         className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-slate-50 active:scale-95 transition-all"
                      >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${task.isWontDo ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                              <XCircle size={22} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">Won't Do</span>
                      </button>
                      
                      <button 
                         onClick={() => { if(task.isDeleted) onPermanentDelete?.(task.id); else onDeleteTask(task.id); setShowOptions(false); onClose(); }}
                         className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-slate-50 active:scale-95 transition-all"
                      >
                          <div className="w-12 h-12 rounded-full bg-slate-100 text-red-500 flex items-center justify-center text-xl">
                              <Trash2 size={22} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">Delete</span>
                      </button>
                  </div>

                  {/* Feature List */}
                  <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                      <button onClick={() => { setIsSubtaskInputFocused(true); setShowOptions(false); }} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                          <CheckSquare size={20} className="text-slate-500" />
                          <span className="font-medium text-slate-700">Add Subtask</span>
                      </button>
                      
                      <button 
                        onClick={() => { 
                            setIsLinkingParent(true); 
                            setShowOptions(false); 
                        }} 
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50"
                      >
                          <Link size={20} className="text-slate-500" />
                          <span className="font-medium text-slate-700">Link Parent Task</span>
                      </button>
                      
                      <button onClick={() => { onStartFocus?.(task.id); setShowOptions(false); }} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                          <Zap size={20} className="text-slate-500" />
                          <span className="font-medium text-slate-700">Start Focus</span>
                      </button>
                      
                      <button onClick={() => { handleSave({ isNote: !task.isNote }); setShowOptions(false); }} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                          <FileText size={20} className="text-slate-500" />
                          <span className="font-medium text-slate-700">{task.isNote ? "Convert to Task" : "Convert to Note"}</span>
                      </button>
                      
                      <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                          <Paperclip size={20} className="text-slate-500" />
                          <span className="font-medium text-slate-700">Attachment</span>
                      </button>
                      
                      <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                          <Tag size={20} className="text-slate-500" />
                          <span className="font-medium text-slate-700">Tags</span>
                      </button>
                      
                      <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50">
                          <Activity size={20} className="text-slate-500" />
                          <span className="font-medium text-slate-700">Task Activities</span>
                      </button>
                  </div>
                  
                  <button onClick={() => setShowOptions(false)} className="w-full py-3 mt-4 text-center font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">
                      Cancel
                  </button>
              </div>
          </div>
      )}

      {/* Parent Task Search Overlay */}
      {isLinkingParent && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in fade-in">
              <div className="h-16 border-b border-slate-100 flex items-center gap-3 px-4 shrink-0">
                  <button onClick={() => setIsLinkingParent(false)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                      <X size={24} />
                  </button>
                  <div className="flex-1 bg-slate-100 rounded-xl flex items-center px-3 py-2">
                      <Search size={18} className="text-slate-400 mr-2" />
                      <input 
                          autoFocus
                          value={parentSearchQuery}
                          onChange={(e) => setParentSearchQuery(e.target.value)}
                          placeholder="Search parent task..."
                          className="bg-transparent border-none outline-none w-full text-sm placeholder-slate-400"
                      />
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  <h3 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                      {parentSearchQuery ? 'Search Results' : 'Recent Tasks'}
                  </h3>
                  
                  {filteredParentTasks.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                          <p>No suitable tasks found.</p>
                      </div>
                  ) : (
                      <div className="space-y-1">
                          {filteredParentTasks.map(t => (
                              <button
                                  key={t.id}
                                  onClick={() => {
                                      if (onLinkTask) {
                                          onLinkTask(task.id, t.id);
                                          setIsLinkingParent(false);
                                      }
                                  }}
                                  className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3 border border-transparent hover:border-slate-100"
                              >
                                  <Circle size={18} className={`${getPriorityColor(t.priority)}`} />
                                  <div className="flex-1 min-w-0">
                                      <div className="font-medium text-slate-800 truncate">{t.title}</div>
                                      {t.dueDate && (
                                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                              <CalendarIcon size={10} />
                                              {format(new Date(t.dueDate), 'MMM d')}
                                          </div>
                                      )}
                                  </div>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-5 space-y-6 pb-24">
              
              {/* Title & Checkbox */}
              <div className="flex items-start gap-4">
                  <button 
                      onClick={() => handleSave({ isCompleted: !task.isCompleted })}
                      className={`mt-1 flex-shrink-0 transition-colors ${task.isCompleted ? 'text-blue-500' : getPriorityColor(priority)}`}
                  >
                      {task.isCompleted ? <CheckCircle2 size={26} /> : <Circle size={26} strokeWidth={2.5} />}
                  </button>
                  <div className="flex-1">
                      <textarea 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          onBlur={handleTitleBlur}
                          placeholder="Task Title"
                          rows={1}
                          className={`w-full text-xl font-bold bg-transparent border-none outline-none resize-none placeholder-slate-300 ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}
                          style={{ minHeight: '32px', height: 'auto' }}
                          onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = `${target.scrollHeight}px`;
                          }}
                      />
                  </div>
              </div>

              {/* Description */}
              <div className="pl-11">
                  <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={handleDescBlur}
                      placeholder="Add details, notes, or links..."
                      className="w-full text-base text-slate-600 bg-transparent border-none outline-none resize-none placeholder-slate-400 min-h-[80px]"
                  />
                  
                  {/* Attachments Preview */}
                  {task.attachments && task.attachments.length > 0 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                          {task.attachments.map(att => (
                              <div key={att.id} className="w-24 h-24 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden relative border border-slate-200">
                                  {att.type === 'image' ? (
                                      <img src={att.url} alt={att.title} className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                                          <FileText />
                                      </div>
                                  )}
                                  <button 
                                     onClick={() => {
                                         const newAtt = task.attachments.filter(a => a.id !== att.id);
                                         onUpdateTask({...task, attachments: newAtt});
                                     }}
                                     className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                                  >
                                      <X size={12} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Properties Grid */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                  {/* Date */}
                  <div 
                    className="flex items-center gap-4 py-2 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer relative"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                          <CalendarIcon size={18} />
                      </div>
                      <div className="flex-1">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Due Date</div>
                          <div className="text-sm font-medium text-slate-700">{getDateText(dueDate, task.isAllDay) || "No Date"}</div>
                      </div>
                      <ChevronRight size={16} className={`text-slate-300 transition-transform ${showDatePicker ? 'rotate-90' : ''}`} />
                  </div>

                  {showDatePicker && (
                      <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-2">
                          <div className="flex border-b border-slate-200">
                              <button onClick={() => setDateTab('date')} className={`flex-1 py-2 text-xs font-bold ${dateTab === 'date' ? 'bg-white text-blue-600' : 'text-slate-500'}`}>Date</button>
                              <button onClick={() => setDateTab('time')} className={`flex-1 py-2 text-xs font-bold ${dateTab === 'time' ? 'bg-white text-blue-600' : 'text-slate-500'}`}>Time</button>
                          </div>
                          {dateTab === 'date' ? renderCalendar() : renderTimePicker()}
                      </div>
                  )}

                  {/* Priority */}
                  <div className="flex items-center gap-4 py-2 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer" onClick={() => {
                      const nextP = priority === Priority.High ? Priority.None : priority + 1;
                      setPriority(nextP);
                      handleSave({ priority: nextP });
                  }}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${priority === Priority.High ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                          <Flag size={18} className={getPriorityColor(priority)} fill={priority !== Priority.None ? "currentColor" : "none"} />
                      </div>
                      <div className="flex-1">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Priority</div>
                          <div className="text-sm font-medium text-slate-700">{Priority[priority]}</div>
                      </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-4 py-2 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                          <Tag size={18} />
                      </div>
                      <div className="flex-1">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tags</div>
                          <div className="flex gap-2 flex-wrap mt-1">
                              {task.tags.length > 0 ? task.tags.map(t => (
                                  <span key={t} className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-medium">#{t}</span>
                              )) : <span className="text-sm text-slate-400">None</span>}
                          </div>
                      </div>
                  </div>

                  {/* Location (Manual Input) */}
                   <div className="flex items-center gap-4 py-2 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer" onClick={() => setShowLocationInput(!showLocationInput)}>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                          <MapPin size={18} />
                      </div>
                      <div className="flex-1">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Location</div>
                          <div className="text-sm font-medium text-slate-700">{task.location?.name || "None"}</div>
                      </div>
                  </div>
                  {showLocationInput && (
                      <div className="flex gap-2 animate-in slide-in-from-top-2">
                          <input 
                              value={locationName}
                              onChange={(e) => setLocationName(e.target.value)}
                              placeholder="Enter location name..."
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleLocationSave()}
                          />
                          <button onClick={handleLocationSave} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold">OK</button>
                      </div>
                  )}

              </div>

              {/* Subtasks Section */}
              <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <CheckSquare size={16} className="text-slate-400" /> Subtasks
                      </h3>
                      <button 
                        onClick={handleAiSubtasks}
                        disabled={isGeneratingSubtasks}
                        className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                          {isGeneratingSubtasks ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          AI Breakdown
                      </button>
                  </div>
                  
                  <div className="space-y-1">
                      {subtasks.map(st => (
                          <SubtaskItem key={st.id} st={st} />
                      ))}
                      
                      {/* Add Subtask Input (Always visible at bottom if not editing existing) */}
                      {!editingSubtaskId && (
                          <div className={`mt-2 bg-slate-50 rounded-xl border transition-colors ${isSubtaskInputFocused ? 'border-blue-200 shadow-sm ring-1 ring-blue-100' : 'border-transparent'}`}>
                              {renderSubtaskInputArea()}
                          </div>
                      )}
                  </div>
              </div>

          </div>
      </div>

      {/* 3. Sticky Bottom Action Bar (Mobile) */}
      <div className="border-t border-slate-100 p-3 bg-white pb-safe">
          <div className="flex items-center justify-between">
              <div className="flex gap-1">
                 <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl hover:bg-slate-50 text-slate-500 relative">
                    <ImageIcon size={20} />
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                    />
                 </button>
                 <button onClick={() => setShowLocationInput(!showLocationInput)} className="p-3 rounded-xl hover:bg-slate-50 text-slate-500">
                    <MapPin size={20} />
                 </button>
                 {/* Removed Repeat icon per user request */}
              </div>
              <button 
                onClick={onClose}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 active:scale-95 transition-all"
              >
                  Done
              </button>
          </div>
      </div>
    </div>
  );
};

export default TaskDetailView;