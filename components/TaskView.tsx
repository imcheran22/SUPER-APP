
import React, { useState } from 'react';
import { Task, Priority, ViewType, List } from '../types';
import { 
  Circle, CheckCircle2, Flag, Calendar as CalendarIcon, Plus, 
  CheckSquare, ChevronRight, User, Hash, Inbox, Repeat, MapPin, Paperclip,
  Search, Layers, Archive, Sun, CalendarDays, Clock, XCircle, Trash2, FileText, Menu,
  MoreVertical, Check, FolderInput, Target, LayoutList, Share2, EyeOff, X, CornerDownRight
} from 'lucide-react';
import { format, isSameDay, addDays, isAfter, isBefore, startOfDay, differenceInCalendarDays } from 'date-fns';
import TaskInputSheet from './TaskInputSheet';

interface TaskViewProps {
  tasks: Task[];
  lists: List[];
  viewType: ViewType | string;
  searchQuery?: string;
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onSelectTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onMenuClick?: () => void;
}

const TaskView: React.FC<TaskViewProps> = ({ 
    tasks, lists, viewType, searchQuery, 
    onToggleTask, onAddTask, onUpdateTask, onSelectTask, onDeleteTask, onMenuClick
}) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  // Filter tasks based on view
  const filteredTasks = tasks.filter(task => {
    // 1. Search Filter
    if (viewType === ViewType.Search) {
        if (!searchQuery) return false;
        if (task.isDeleted) return false;
        const query = searchQuery.toLowerCase();
        return task.title.toLowerCase().includes(query) || 
               task.description?.toLowerCase().includes(query) ||
               task.tags.some(t => t.toLowerCase().includes(query));
    }

    // 2. Trash View
    if (viewType === ViewType.Trash) {
        return task.isDeleted || task.isWontDo;
    }

    // 3. Global Exclusion
    if (task.isDeleted) return false;
    if (task.isWontDo) return false;

    // 4. View Filters
    const today = new Date();
    const hideCompleted = viewType !== ViewType.Completed && viewType !== ViewType.Search; 
    if (hideCompleted && task.isCompleted) return false;

    if (viewType === ViewType.Inbox) return task.listId === 'inbox';
    if (viewType === ViewType.All) return true;
    if (viewType === ViewType.Completed) return task.isCompleted;
    
    if (viewType === ViewType.Today) {
      return task.dueDate && isSameDay(new Date(task.dueDate), today);
    }
    
    if (viewType === ViewType.Next7Days) {
      const nextWeek = addDays(today, 7);
      return task.dueDate && isAfter(new Date(task.dueDate), today) && !isAfter(new Date(task.dueDate), nextWeek);
    }

    return task.listId === viewType;
  });

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.High: return 'text-red-500';
      case Priority.Medium: return 'text-yellow-500';
      case Priority.Low: return 'text-blue-500';
      default: return 'text-slate-300';
    }
  };

  const getListColor = (listId: string) => {
      if (listId === 'inbox') return '#3b82f6';
      const list = lists.find(l => l.id === listId);
      return list ? list.color : 'transparent';
  };

  const getHeaderInfo = () => {
    switch (viewType) {
        case ViewType.Inbox: return { title: "Inbox", icon: <Inbox size={20} className="text-blue-500"/> };
        case ViewType.Today: return { title: "Today", icon: <Sun size={20} className="text-orange-500"/> };
        case ViewType.Next7Days: return { title: "Next 7 Days", icon: <CalendarDays size={20} className="text-purple-500"/> };
        case ViewType.All: return { title: "All Tasks", icon: <Layers size={20} className="text-slate-500"/> };
        case ViewType.Completed: return { title: "Completed", icon: <Archive size={20} className="text-green-500"/> };
        case ViewType.Trash: return { title: "Trash", icon: <Trash2 size={20} className="text-red-500"/> };
        case ViewType.Search: return { title: `Search: "${searchQuery}"`, icon: <Search size={20} className="text-slate-500"/> };
        default: 
            const list = lists.find(l => l.id === viewType);
            return { title: list?.name || "Tasks", icon: <CheckSquare size={20} style={{ color: list?.color }}/> };
    }
  };

  const { title, icon } = getHeaderInfo();

  // --- Select Mode Handlers ---
  const toggleSelectMode = () => {
      setIsSelectMode(!isSelectMode);
      setSelectedIds(new Set());
      setShowMenu(false);
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const selectAll = () => {
      if (selectedIds.size === filteredTasks.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(filteredTasks.map(t => t.id)));
      }
  };

  const handleBulkComplete = () => {
      selectedIds.forEach(id => {
          const task = tasks.find(t => t.id === id);
          if (task) onUpdateTask({ ...task, isCompleted: true });
      });
      toggleSelectMode();
  };

  const handleBulkDelete = () => {
      if (onDeleteTask) {
          selectedIds.forEach(id => onDeleteTask(id));
      }
      toggleSelectMode();
  };
  
  const handleBulkDate = () => {
     // Mock functionality for UI demo
     const today = new Date();
     selectedIds.forEach(id => {
          const task = tasks.find(t => t.id === id);
          if(task) onUpdateTask({ ...task, dueDate: today });
     });
     toggleSelectMode();
  }

  const handleBulkMove = (targetListId: string) => {
      selectedIds.forEach(id => {
          const task = tasks.find(t => t.id === id);
          if (task) onUpdateTask({ ...task, listId: targetListId });
      });
      setShowMoveMenu(false);
      toggleSelectMode();
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white relative overflow-hidden">
      {/* Toolbar */}
      <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 bg-white z-10 flex-shrink-0 shadow-sm safe-pt transition-colors duration-200">
        {!isSelectMode ? (
            <>
                <div className="flex items-center gap-3">
                    <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors active:bg-slate-200">
                        <Menu size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        {icon}
                        {title}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                   {viewType !== ViewType.Search && (
                        <span className="bg-slate-100 px-2.5 py-1 rounded-full text-xs font-bold text-slate-500">{filteredTasks.length}</span>
                   )}
                   <div className="relative">
                       <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                           <MoreVertical size={20} />
                       </button>
                       {/* Dropdown Menu */}
                       {showMenu && (
                           <>
                               <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                               <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-30 py-1 animate-in zoom-in-95 origin-top-right">
                                   <button 
                                      onClick={() => { setShowDetails(!showDetails); setShowMenu(false); }}
                                      className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-3"
                                   >
                                       <LayoutList size={16} /> {showDetails ? "Hide Details" : "Show Details"}
                                   </button>
                                   <button className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-3">
                                       <EyeOff size={16} /> Hide Completed
                                   </button>
                                   <button 
                                      onClick={toggleSelectMode}
                                      className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-3"
                                    >
                                       <CheckSquare size={16} /> Select
                                   </button>
                                   <button className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-3">
                                       <Share2 size={16} /> Share
                                   </button>
                               </div>
                           </>
                       )}
                   </div>
                </div>
            </>
        ) : (
            // Select Mode Header
            <>
                <div className="flex items-center gap-4">
                    <button onClick={toggleSelectMode} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
                        <X size={24} />
                    </button>
                    <span className="text-lg font-bold text-slate-800">{selectedIds.size} Selected</span>
                </div>
                <button onClick={selectAll} className="p-2 text-blue-600 font-medium text-sm hover:bg-blue-50 rounded-lg">
                    {selectedIds.size === filteredTasks.length ? "Deselect All" : "Select All"}
                </button>
            </>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 relative bg-slate-50">
        <div className="max-w-4xl mx-auto">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                <div className="mb-4 text-slate-200">
                    {viewType === ViewType.Trash ? <Trash2 size={64} strokeWidth={1} /> : (viewType === ViewType.Search ? <Search size={64} strokeWidth={1} /> : <CheckSquare size={64} strokeWidth={1} />)}
                </div>
                <p>
                    {viewType === ViewType.Search ? "No matching tasks found." : 
                     viewType === ViewType.Trash ? "Trash is empty." :
                     "No tasks found. Add one below!"}
                </p>
            </div>
          ) : (
            <div className="pb-32">
              {filteredTasks.map(task => {
                  const now = new Date();
                  const taskDate = task.dueDate ? new Date(task.dueDate) : null;
                  const isOverdue = taskDate && !task.isCompleted && !task.isNote && isBefore(startOfDay(taskDate), startOfDay(now));
                  const overdueDays = isOverdue && taskDate ? differenceInCalendarDays(startOfDay(now), startOfDay(taskDate)) : 0;
                  const isSelected = selectedIds.has(task.id);
                  
                  return (
                    <div 
                        key={task.id} 
                        className={`relative group flex items-start border-b border-slate-100 transition-all cursor-pointer ${isSelected ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50 active:bg-slate-100'}`}
                        style={{ minHeight: showDetails ? 'auto' : '60px' }} 
                        onClick={() => isSelectMode ? toggleSelection(task.id) : onSelectTask(task.id)}
                    >
                        {/* Project Color Strip */}
                        {!isSelectMode && (
                             <div 
                                className="absolute left-0 top-0 bottom-0 w-[3px]"
                                style={{ backgroundColor: getListColor(task.listId) }}
                             />
                        )}

                        {/* Checkbox Section */}
                        <div className="pl-[15px] pr-[10px] py-[13px] flex-shrink-0">
                            {isSelectMode ? (
                                <button className={`w-[24px] h-[24px] flex items-center justify-center rounded-full border-2 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'}`}>
                                    {isSelected && <Check size={16} strokeWidth={3} />}
                                </button>
                            ) : (
                                task.isNote ? (
                                    <div className="w-[24px] h-[24px] flex items-center justify-center text-slate-400">
                                        <FileText size={20} />
                                    </div>
                                ) : (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                                        className={`w-[44px] h-[44px] flex items-center justify-center -ml-2 ${getPriorityColor(task.priority)} checkbox-press ${task.isCompleted ? 'checkbox-bounce' : ''}`}
                                    >
                                        {task.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                    </button>
                                )
                            )}
                        </div>
                        
                        {/* Title Section */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center my-[13px] mr-3">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <div className={`text-[15px] text-slate-900 truncate leading-snug ${task.isCompleted ? 'line-through text-slate-400' : ''} ${task.isNote ? 'italic text-slate-600' : ''}`}>
                                    {task.title}
                                </div>
                                {task.tags.map(tag => (
                                    <span key={tag} className="text-[10px] text-blue-500 bg-blue-50 px-1.5 rounded-sm font-medium">#{tag}</span>
                                ))}
                                {task.isWontDo && (
                                    <span className="text-[10px] text-red-500 bg-red-50 px-1.5 rounded-sm font-medium border border-red-100">Won't Do</span>
                                )}
                                {task.isDeleted && (
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 rounded-sm font-medium border border-slate-200">Deleted</span>
                                )}
                            </div>
                            
                            {/* Expanded Details View */}
                            {showDetails && (
                                <div className="mt-1 space-y-1">
                                    {task.description && (
                                        <div className="text-[13px] text-slate-500 line-clamp-2">
                                            {task.description}
                                        </div>
                                    )}
                                    {task.subtasks && task.subtasks.length > 0 && (
                                        <div className="space-y-0.5 mt-2 pl-1">
                                            {task.subtasks.map(st => (
                                                <div key={st.id} className="flex items-center gap-2 text-xs text-slate-500">
                                                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                                    <span className={st.isCompleted ? 'line-through opacity-50' : ''}>{st.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {task.repeat && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1"><Repeat size={10} /> {task.repeat}</span>}
                                        {task.location && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1"><MapPin size={10} /> {task.location.name}</span>}
                                    </div>
                                </div>
                            )}

                            {/* Condensed details (hidden if expanded and redundant, but shown if collapsed) */}
                            {!showDetails && task.description && (
                                <div className="text-[12px] text-slate-400 truncate mt-0.5">
                                    {task.description}
                                </div>
                            )}
                        </div>

                        {/* Date/Icon Section - Aligned Top Right in Expanded */}
                        <div className="flex flex-col items-end gap-1 mt-[13px] mr-3 flex-shrink-0">
                            {taskDate && !task.isNote && (
                                <div className="flex flex-col items-end">
                                    <span className={`text-[12px] font-medium ${
                                        isOverdue ? 'text-red-500' : 
                                        isSameDay(taskDate, now) ? 'text-blue-600' : 'text-slate-400'
                                    }`}>
                                        {format(taskDate, 'MMM d')}
                                    </span>
                                    {!task.isAllDay && <span className="text-[10px] text-slate-400">{format(taskDate, 'HH:mm')}</span>}
                                    
                                    {isOverdue && (
                                        <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1 rounded-sm mt-0.5">
                                            {overdueDays}d late
                                        </span>
                                    )}
                                </div>
                            )}
                            {/* Indicators */}
                            {!showDetails && (
                                <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                                    {task.repeat && <Repeat size={13} />}
                                    {task.location && <MapPin size={13} />}
                                    {task.attachments && task.attachments.length > 0 && <Paperclip size={13} />}
                                </div>
                            )}
                        </div>
                    </div>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Footer Quick Add / FAB */}
      {viewType !== ViewType.Trash && viewType !== ViewType.Completed && !isSelectMode && (
          <div className="absolute bottom-8 right-8 z-20 animate-in zoom-in duration-300">
              <button 
                onClick={() => setIsQuickAddOpen(true)}
                className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 hover:scale-105 transition-all active:scale-95 flex items-center justify-center"
              >
                  <Plus size={28} />
              </button>
          </div>
      )}

      {/* Bulk Action Bar */}
      {isSelectMode && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-between items-center z-30 safe-pb shadow-up animate-in slide-in-from-bottom">
              <button onClick={handleBulkComplete} className="flex-1 flex flex-col items-center gap-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg active:scale-95 transition-all">
                  <CheckSquare size={22} />
                  <span className="text-[10px] font-medium">Done</span>
              </button>
              <button onClick={handleBulkDate} className="flex-1 flex flex-col items-center gap-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg active:scale-95 transition-all">
                  <CalendarIcon size={22} />
                  <span className="text-[10px] font-medium">Date</span>
              </button>
              <button 
                  onClick={() => setShowMoveMenu(true)}
                  className="flex-1 flex flex-col items-center gap-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg active:scale-95 transition-all"
              >
                  <FolderInput size={22} />
                  <span className="text-[10px] font-medium">Move</span>
              </button>
              <button className="flex-1 flex flex-col items-center gap-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg active:scale-95 transition-all">
                  <Target size={22} />
                  <span className="text-[10px] font-medium">Priority</span>
              </button>
              <button onClick={handleBulkDelete} className="flex-1 flex flex-col items-center gap-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg active:scale-95 transition-all">
                  <MoreVertical size={22} />
                  <span className="text-[10px] font-medium">More</span>
              </button>
          </div>
      )}

      {/* Bulk Move Modal */}
      {showMoveMenu && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setShowMoveMenu(false)}>
              <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Move {selectedIds.size} Tasks to...</h3>
                  <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                      <button 
                        onClick={() => handleBulkMove('inbox')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left transition-colors"
                      >
                           <Inbox size={20} className="text-blue-500" />
                           <span className="font-medium text-slate-700">Inbox</span>
                      </button>
                      {lists.map(list => (
                          <button 
                              key={list.id} 
                              onClick={() => handleBulkMove(list.id)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left transition-colors"
                          >
                              <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: list.color }} />
                              <span className="font-medium text-slate-700">{list.name}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      <TaskInputSheet 
         isOpen={isQuickAddOpen}
         onClose={() => setIsQuickAddOpen(false)}
         onAddTask={onAddTask}
         lists={lists}
      />
    </div>
  );
};

export default TaskView;
