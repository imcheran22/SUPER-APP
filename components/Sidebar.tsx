import React, { useState } from 'react';
import { 
  Inbox, 
  Calendar, 
  CheckSquare, 
  Clock, 
  LayoutGrid, 
  Target, 
  Sun,
  CalendarDays,
  KanbanSquare,
  Tags,
  Layers,
  Archive,
  Settings,
  Trash2,
  X,
  Plus,
  Check
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  lists: { id: string; name: string; color: string }[];
  enabledFeatures?: string[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenSettings?: () => void;
  isOpen: boolean;
  onClose: () => void;
  onAddList?: (name: string, color: string) => void;
  onDeleteList?: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, 
    onChangeView, 
    lists, 
    enabledFeatures = ['tasks', 'calendar', 'matrix', 'habits', 'focus'],
    onOpenSettings,
    isOpen,
    onClose,
    onAddList,
    onDeleteList
}) => {
  const [isManagingLists, setIsManagingLists] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const navItemClass = (view: ViewType) => `
    flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium select-none touch-manipulation active:bg-slate-100
    ${currentView === view ? 'bg-blue-100 text-blue-600' : 'text-slate-600'}
  `;

  const showFeature = (id: string) => enabledFeatures.includes(id);

  const handleCreateList = () => {
      if (newListTitle.trim() && onAddList) {
          // Random color from a set
          const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#818cf8', '#c084fc', '#f472b6'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          onAddList(newListTitle, randomColor);
          setNewListTitle('');
          // Do NOT close the modal, allowing multiple additions
      }
  };

  return (
    <>
        {/* Mobile Backdrop */}
        <div 
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />

        {/* Sidebar Container */}
        <div className={`
            fixed md:static inset-y-0 left-0 z-50
            h-full bg-slate-50 flex flex-col 
            transition-transform duration-300 ease-in-out
            w-[80vw] max-w-xs md:w-64
            ${isOpen ? 'translate-x-0 border-r border-slate-200' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0'}
            overflow-hidden whitespace-nowrap shadow-2xl md:shadow-none
        `}>
        
        <div className="flex-col flex h-full p-4 min-w-[16rem]">
            {/* App Header */}
            <div className="mb-6 px-2 pt-safe flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                    ✓
                    </div>
                    <span className="text-xl font-bold text-slate-800">TickTick</span>
                </div>
                {/* Mobile Close Button */}
                <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pb-safe">
                {showFeature('tasks') && (
                    <>
                        <div onClick={() => onChangeView(ViewType.All)} className={navItemClass(ViewType.All)}>
                            <Layers size={18} /> All
                        </div>
                        <div onClick={() => onChangeView(ViewType.Inbox)} className={navItemClass(ViewType.Inbox)}>
                            <Inbox size={18} /> Inbox
                        </div>
                        <div onClick={() => onChangeView(ViewType.Today)} className={navItemClass(ViewType.Today)}>
                            <Sun size={18} /> Today
                        </div>
                        <div onClick={() => onChangeView(ViewType.Next7Days)} className={navItemClass(ViewType.Next7Days)}>
                            <CalendarDays size={18} /> Next 7 Days
                        </div>
                    </>
                )}

                {(showFeature('calendar') || showFeature('matrix')) && (
                    <div className="mt-6 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Views
                    </div>
                )}
                
                {showFeature('calendar') && (
                    <div onClick={() => onChangeView(ViewType.Calendar)} className={navItemClass(ViewType.Calendar)}>
                    <Calendar size={18} /> Calendar
                    </div>
                )}
                {showFeature('matrix') && (
                    <div onClick={() => onChangeView(ViewType.Matrix)} className={navItemClass(ViewType.Matrix)}>
                    <LayoutGrid size={18} /> Eisenhower Matrix
                    </div>
                )}
                
                <div onClick={() => onChangeView(ViewType.Kanban)} className={navItemClass(ViewType.Kanban)}>
                    <KanbanSquare size={18} /> Kanban Board
                </div>

                {(showFeature('habits') || showFeature('focus')) && (
                    <div className="mt-6 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Habits & Focus
                    </div>
                )}

                {showFeature('habits') && (
                    <div onClick={() => onChangeView(ViewType.Habits)} className={navItemClass(ViewType.Habits)}>
                    <Target size={18} /> Habits
                    </div>
                )}
                {showFeature('focus') && (
                    <div onClick={() => onChangeView(ViewType.Focus)} className={navItemClass(ViewType.Focus)}>
                    <Clock size={18} /> Pomo Focus
                    </div>
                )}

                <div className="mt-6 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                    <span>Lists & Tags</span>
                    <button 
                        onClick={() => setIsManagingLists(true)} 
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                        title="Manage Lists"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                
                <div onClick={() => onChangeView(ViewType.Tags)} className={navItemClass(ViewType.Tags)}>
                    <Tags size={18} /> All Tags
                </div>

                {lists.map(list => (
                <div 
                    key={list.id} 
                    onClick={() => onChangeView(list.id as any)} 
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${currentView === (list.id as any) ? 'bg-blue-100 text-blue-600' : 'text-slate-600 hover:bg-gray-100'}`}
                    >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: list.color }} />
                    <span className="truncate flex-1">{list.name}</span>
                </div>
                ))}

                <div className="mt-6 border-t border-slate-200 pt-2 pb-safe">
                    <div onClick={() => onChangeView(ViewType.Completed)} className={navItemClass(ViewType.Completed)}>
                        <Archive size={18} /> Completed
                    </div>
                    <div onClick={() => onChangeView(ViewType.Trash)} className={navItemClass(ViewType.Trash)}>
                        <Trash2 size={18} /> Trash
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-200 pb-safe">
                <button 
                    onClick={onOpenSettings}
                    className="w-full flex items-center gap-3 px-3 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                <Settings size={20} />
                <span className="text-sm font-medium">Settings</span>
                </button>
            </div>
        </div>

        {/* Manage Lists Modal - Centered */}
        {isManagingLists && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setIsManagingLists(false)}>
                <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[80vh] m-auto relative" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Manage Lists</h3>
                        <button onClick={() => setIsManagingLists(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Add List Input */}
                    <div className="flex gap-2 mb-6">
                        <input 
                            autoFocus
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            placeholder="New list name"
                            className="flex-1 text-base bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateList();
                            }}
                        />
                        <button 
                            onClick={handleCreateList} 
                            disabled={!newListTitle.trim()} 
                            className="bg-blue-600 text-white font-bold p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* List of existing lists */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-1">
                        {lists.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">No lists yet. Add one above!</div>
                        ) : (
                            lists.map(list => (
                                <div key={list.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: list.color }} />
                                        <span className="font-medium text-slate-700">{list.name}</span>
                                    </div>
                                    <button 
                                        onClick={() => onDeleteList?.(list.id)}
                                        className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Delete List"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <button 
                            onClick={() => setIsManagingLists(false)} 
                            className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    </>
  );
};

export default Sidebar;