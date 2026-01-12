
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
  Search
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  lists: { id: string; name: string; color: string }[];
  enabledFeatures?: string[];
  onOpenSettings?: () => void;
  isOpen: boolean;
  onClose: () => void;
  onAddList?: (name: string, color: string) => void;
  onDeleteList?: (id: string) => void;
  onSearch: (query: string) => void;
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
    onDeleteList,
    onSearch
}) => {
  const [isManagingLists, setIsManagingLists] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const navItemClass = (view: ViewType) => `
    flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm font-semibold select-none active:scale-95
    ${currentView === view ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-600 hover:bg-slate-200/50'}
  `;

  const showFeature = (id: string) => enabledFeatures.includes(id);

  const handleCreateList = () => {
      if (newListTitle.trim() && onAddList) {
          const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#818cf8', '#c084fc', '#f472b6'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          onAddList(newListTitle, randomColor);
          setNewListTitle('');
      }
  };

  return (
    <>
        {/* Mobile Overlay */}
        <div 
            className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />

        <div className={`
            fixed md:static inset-y-0 left-0 z-50
            h-full bg-slate-50 flex flex-col 
            transition-all duration-300 ease-in-out
            w-[280px] border-r border-slate-200
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-[280px]'}
            overflow-hidden whitespace-nowrap shadow-2xl md:shadow-none
        `}>
        
        <div className="flex flex-col h-full p-4 min-w-[280px]">
            {/* Header: Logo & Close */}
            <div className="mb-6 px-2 pt-safe flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100">
                    ✓
                    </div>
                    <span className="text-xl font-black text-slate-800 tracking-tight">TickTick</span>
                </div>
                <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Search Input */}
            <div className="px-1 mb-4">
                <div className="bg-slate-200/50 flex items-center px-3 py-2.5 rounded-xl gap-2 hover:bg-slate-200 transition-colors group cursor-text" onClick={() => document.getElementById('sidebar-search')?.focus()}>
                    <Search size={18} className="text-slate-400 group-hover:text-slate-600" />
                    <input 
                        id="sidebar-search"
                        placeholder="Search" 
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
                        onChange={(e) => { 
                            onSearch(e.target.value); 
                            if(e.target.value) {
                                onChangeView(ViewType.Search);
                            }
                        }} 
                    />
                </div>
            </div>

            {/* Nav Items */}
            <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar pb-4">
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

                <div className="mt-8 mb-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                    Planning
                </div>
                
                {showFeature('calendar') && (
                    <div onClick={() => onChangeView(ViewType.Calendar)} className={navItemClass(ViewType.Calendar)}>
                        <Calendar size={18} /> Calendar
                    </div>
                )}
                {showFeature('matrix') && (
                    <div onClick={() => onChangeView(ViewType.Matrix)} className={navItemClass(ViewType.Matrix)}>
                        <LayoutGrid size={18} /> Matrix
                    </div>
                )}
                <div onClick={() => onChangeView(ViewType.Kanban)} className={navItemClass(ViewType.Kanban)}>
                    <KanbanSquare size={18} /> Kanban
                </div>

                <div className="mt-8 mb-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                    Health & Focus
                </div>

                {showFeature('habits') && (
                    <div onClick={() => onChangeView(ViewType.Habits)} className={navItemClass(ViewType.Habits)}>
                        <Target size={18} /> Habits
                    </div>
                )}
                {showFeature('focus') && (
                    <div onClick={() => onChangeView(ViewType.Focus)} className={navItemClass(ViewType.Focus)}>
                        <Clock size={18} /> Focus
                    </div>
                )}

                <div className="mt-8 mb-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] flex justify-between items-center">
                    <span>Lists</span>
                    <button onClick={() => setIsManagingLists(true)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                        <Plus size={14} />
                    </button>
                </div>
                
                <div onClick={() => onChangeView(ViewType.Tags)} className={navItemClass(ViewType.Tags)}>
                    <Tags size={18} /> Tags
                </div>

                {lists.map(list => (
                    <div 
                        key={list.id} 
                        onClick={() => onChangeView(list.id as any)} 
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm font-semibold mb-1 ${currentView === (list.id as any) ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200/50'}`}
                    >
                        <div className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: list.color }} />
                        <span className="truncate flex-1">{list.name}</span>
                    </div>
                ))}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 pb-safe space-y-1">
                <div onClick={() => onChangeView(ViewType.Completed)} className={navItemClass(ViewType.Completed)}>
                    <Archive size={18} /> Completed
                </div>
                <div onClick={() => onChangeView(ViewType.Trash)} className={navItemClass(ViewType.Trash)}>
                    <Trash2 size={18} /> Trash
                </div>
                <button 
                    onClick={onOpenSettings}
                    className="w-full flex items-center gap-3 px-3 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl cursor-pointer transition-all mt-4 font-bold active:scale-95"
                >
                    <Settings size={20} />
                    <span className="text-sm">Account & Auth</span>
                </button>
            </div>
        </div>

        {/* Manage Lists Modal */}
        {isManagingLists && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsManagingLists(false)}>
                <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[80vh] m-auto relative" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-800">Manage Lists</h3>
                        <button onClick={() => setIsManagingLists(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <input 
                            autoFocus
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            placeholder="New list name..."
                            className="flex-1 text-base bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                        />
                        <button onClick={handleCreateList} disabled={!newListTitle.trim()} className="bg-blue-600 text-white p-3.5 rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all active:scale-95">
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                        {lists.map(list => (
                            <div key={list.id} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl group transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: list.color }} />
                                    <span className="font-bold text-slate-700">{list.name}</span>
                                </div>
                                <button onClick={() => onDeleteList?.(list.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        </div>
    </>
  );
};

export default Sidebar;
