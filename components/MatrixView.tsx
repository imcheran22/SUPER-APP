import React, { useState } from 'react';
import { Task, Priority, List } from '../types';
import { Plus, Menu, Flag } from 'lucide-react';
import { isSameDay, isAfter, isBefore, addDays, startOfToday } from 'date-fns';
import TaskInputSheet from './TaskInputSheet';

interface MatrixViewProps {
  tasks: Task[];
  lists: List[];
  onMenuClick?: () => void;
  onUpdateTask?: (task: Task) => void;
  onAddTask: (task: Task) => void;
}

interface QuadrantConfig {
    priority: Priority;
    dueDate: Date;
    title: string;
}

const MatrixView: React.FC<MatrixViewProps> = ({ tasks, lists, onMenuClick, onUpdateTask, onAddTask }) => {
  const today = startOfToday();
  const [activeQuadrant, setActiveQuadrant] = useState<QuadrantConfig | null>(null);

  const isUrgent = (t: Task) => t.dueDate && (isSameDay(new Date(t.dueDate), today) || isBefore(new Date(t.dueDate), today));
  // Important if High or Medium
  const isImportant = (t: Task) => t.priority === Priority.High || t.priority === Priority.Medium;

  // Refined Logic for visual consistency:
  const q1 = tasks.filter(t => !t.isCompleted && isUrgent(t) && isImportant(t));
  const q2 = tasks.filter(t => !t.isCompleted && !isUrgent(t) && isImportant(t));
  const q3 = tasks.filter(t => !t.isCompleted && isUrgent(t) && !isImportant(t));
  const q4 = tasks.filter(t => !t.isCompleted && !isUrgent(t) && !isImportant(t));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
      e.dataTransfer.setData('taskId', taskId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, quadrant: string) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('taskId');
      if (!taskId || !onUpdateTask) return;

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updates: Partial<Task> = {};
      
      switch (quadrant) {
          case 'Q1': 
              updates.priority = Priority.High;
              updates.dueDate = today;
              break;
          case 'Q2': 
              updates.priority = Priority.Medium; // Changed to Medium to match Yellow
              updates.dueDate = addDays(today, 1);
              break;
          case 'Q3': 
              updates.priority = Priority.Low;
              updates.dueDate = today;
              break;
          case 'Q4':
              updates.priority = Priority.None; // Changed to None to match Grey
              updates.dueDate = addDays(today, 1);
              break;
      }
      
      onUpdateTask({ ...task, ...updates });
  };

  const handleAddTaskClick = (quadrantId: string) => {
      let config: QuadrantConfig;
      switch (quadrantId) {
          case 'Q1': config = { priority: Priority.High, dueDate: today, title: 'Urgent & Important' }; break;
          case 'Q2': config = { priority: Priority.Medium, dueDate: addDays(today, 1), title: 'Not Urgent & Important' }; break; // Medium
          case 'Q3': config = { priority: Priority.Low, dueDate: today, title: 'Urgent & Unimportant' }; break;
          case 'Q4': config = { priority: Priority.None, dueDate: addDays(today, 1), title: 'Not Urgent & Unimportant' }; break; // None
          default: return;
      }
      setActiveQuadrant(config);
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
        case Priority.High: return 'text-red-500';
        case Priority.Medium: return 'text-yellow-500';
        case Priority.Low: return 'text-blue-500';
        default: return 'text-slate-400';
    }
  };

  const Quadrant = ({ id, title, color, bg, border, items }: any) => (
      <div 
        className={`flex-1 flex flex-col rounded-xl border ${border} ${bg} overflow-hidden shadow-sm transition-colors`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, id)}
      >
          <div className={`px-4 py-3 border-b ${border} flex justify-between items-center`}>
              <h3 className={`font-bold ${color} text-sm uppercase tracking-wide`}>{title}</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/50 ${color}`}>{items.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {items.map((task: Task) => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
                  >
                      <div className="flex items-start gap-2">
                          <div className={`mt-0.5 ${getPriorityColor(task.priority)}`}>
                              <Flag size={14} fill={task.priority !== Priority.None ? "currentColor" : "none"} />
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight">{task.title}</div>
                              {task.dueDate && (
                                  <div className="text-[10px] text-slate-400 mt-1">
                                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              ))}
              <button 
                onClick={() => handleAddTaskClick(id)}
                className="w-full py-2 text-xs text-slate-400 font-medium hover:bg-white/50 rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                  <Plus size={14} /> Add Task
              </button>
          </div>
      </div>
  );

  return (
    <div className="flex-1 h-full p-4 bg-slate-50 overflow-hidden flex flex-col">
       <div className="h-14 flex items-center justify-between mb-2">
         <div className="flex items-center gap-3">
             <button onClick={onMenuClick} className="p-1 -ml-1 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
                 <Menu size={24} />
             </button>
             <h1 className="text-2xl font-bold text-slate-800">Eisenhower Matrix</h1>
         </div>
       </div>
       
       <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 min-h-0">
          <Quadrant id="Q1" title="Urgent & Important" items={q1} color="text-red-600" bg="bg-red-50" border="border-red-100" />
          <Quadrant id="Q2" title="Not Urgent & Important" items={q2} color="text-yellow-600" bg="bg-yellow-50" border="border-yellow-100" />
          <Quadrant id="Q3" title="Urgent & Unimportant" items={q3} color="text-blue-600" bg="bg-blue-50" border="border-blue-100" />
          {/* Changed Q4 to Slate/Gray to match Priority.None */}
          <Quadrant id="Q4" title="Not Urgent & Unimportant" items={q4} color="text-slate-500" bg="bg-slate-100" border="border-slate-200" />
       </div>

       <TaskInputSheet 
           isOpen={!!activeQuadrant}
           onClose={() => setActiveQuadrant(null)}
           onAddTask={onAddTask}
           lists={lists}
           initialConfig={activeQuadrant ? {
               priority: activeQuadrant.priority,
               dueDate: activeQuadrant.dueDate
           } : undefined}
       />
    </div>
  );
};

export default MatrixView;