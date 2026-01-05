import React, { useMemo, useState } from 'react';
import { Task, Priority } from '../types';
import { Hash, CheckCircle2, Circle, ChevronRight, Menu } from 'lucide-react';
import { format } from 'date-fns';

interface TagsViewProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onMenuClick?: () => void;
}

const TagsView: React.FC<TagsViewProps> = ({ tasks, onToggleTask, onSelectTask, onMenuClick }) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags and count usage
  const tags = useMemo(() => {
    const tagMap = new Map<string, number>();
    tasks.forEach(t => {
        t.tags.forEach(tag => {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        });
    });
    return Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]); // Sort by count desc
  }, [tasks]);

  const filteredTasks = selectedTag 
    ? tasks.filter(t => t.tags.includes(selectedTag))
    : [];

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.High: return 'text-red-500';
      case Priority.Medium: return 'text-yellow-500';
      case Priority.Low: return 'text-blue-500';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={onMenuClick} className="p-1 -ml-1 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
                    <Menu size={24} />
                </button>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Hash size={20} className="text-slate-500" />
                    {selectedTag ? `#${selectedTag}` : 'Tags Manager'}
                </h1>
            </div>
            {selectedTag && (
                <button 
                    onClick={() => setSelectedTag(null)}
                    className="text-sm font-medium text-blue-600 hover:underline"
                >
                    View All Tags
                </button>
            )}
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Tag List / Sidebar */}
            <div className={`${selectedTag ? 'hidden md:block w-64 border-r border-slate-100' : 'w-full'} overflow-y-auto p-4 custom-scrollbar bg-slate-50`}>
                <div className="space-y-1">
                    {tags.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            <Hash size={48} className="mx-auto mb-2 opacity-20" />
                            <p>No tags found.</p>
                            <p className="text-xs mt-1">Add tags to your tasks to see them here.</p>
                        </div>
                    )}
                    {tags.map(([tag, count]) => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors group ${selectedTag === tag ? 'bg-blue-100 text-blue-700' : 'hover:bg-white hover:shadow-sm text-slate-700'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedTag === tag ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-500'}`}>
                                    #
                                </div>
                                <span className="font-medium">{tag}</span>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selectedTag === tag ? 'bg-blue-200' : 'bg-slate-200 text-slate-500'}`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Task List (Visible only when tag selected) */}
            {selectedTag && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white">
                    {filteredTasks.map(task => (
                        <div 
                            key={task.id} 
                            className="flex items-center bg-white hover:bg-slate-50 border-b border-slate-100 transition-all cursor-pointer p-4 group"
                            onClick={() => onSelectTask(task.id)}
                        >
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                                className={`flex-shrink-0 mr-4 ${getPriorityColor(task.priority)} ${task.isCompleted ? 'text-slate-400' : ''}`}
                            >
                                {task.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                                <div className={`text-base text-slate-900 ${task.isCompleted ? 'line-through text-slate-400' : ''}`}>
                                    {task.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    {task.dueDate && (
                                        <span className={`text-xs ${task.isCompleted ? 'text-slate-300' : 'text-red-500'}`}>
                                            {format(new Date(task.dueDate), 'MMM d')}
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        {task.listId}
                                    </span>
                                </div>
                            </div>

                            <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                    {filteredTasks.length === 0 && (
                        <div className="text-center py-20 text-slate-400">
                            No tasks found with this tag.
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default TagsView;