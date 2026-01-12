
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TaskView from './components/TaskView';
import TaskDetailView from './components/TaskDetailView';
import HabitView, { HabitStatsView } from './components/HabitView';
import FocusView from './components/FocusView';
import MatrixView from './components/MatrixView';
import CalendarView from './components/CalendarView';
import KanbanView from './components/KanbanView';
import TagsView from './components/TagsView';
import { Task, Priority, ViewType, Habit, FocusCategory, List, AppSettings, FocusSession, Subtask } from './types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './services/storageService';
import { initFirebase, loginWithGoogle, logoutUser } from './services/firebaseService';
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent } from './services/googleCalendarService';
import { requestNotificationPermission, sendNotification, playAlarmSound } from './services/notificationService';
import { X, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import { isSameMinute } from 'date-fns';

const App: React.FC = () => {
  // --- Main App State ---
  const [currentView, setCurrentView] = useState<ViewType | string>(ViewType.Inbox);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage(STORAGE_KEYS.SETTINGS, {}));
  
  // --- Sidebar State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Data Initialization ---
  const [lists, setLists] = useState<List[]>(() => loadFromStorage(STORAGE_KEYS.LISTS, [
      { id: 'work', name: 'Work', color: '#3b82f6' },
      { id: 'personal', name: 'Personal', color: '#10b981' }
  ]));

  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(STORAGE_KEYS.TASKS, [
    { 
      id: '1', 
      title: 'Welcome to TickTick Clone!', 
      description: 'This is a sample task. Try clicking the checkbox.',
      isCompleted: false, 
      priority: Priority.High, 
      listId: 'inbox', 
      tags: ['welcome'], 
      dueDate: new Date(),
      isAllDay: false,
      subtasks: [],
      attachments: []
    }
  ]));

  const [habits, setHabits] = useState<Habit[]>(() => loadFromStorage(STORAGE_KEYS.HABITS, []));

  const [focusCategories, setFocusCategories] = useState<FocusCategory[]>(() => loadFromStorage(STORAGE_KEYS.FOCUS, [
      { id: 'fc1', name: 'Work', icon: 'briefcase', color: '#3b82f6', mode: 'pomo', defaultDuration: 25 },
      { id: 'fc2', name: 'Study', icon: 'book', color: '#f59e0b', mode: 'pomo', defaultDuration: 45 },
  ]));

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => loadFromStorage(STORAGE_KEYS.FOCUS_SESSIONS, []));

  // --- Auth State ---
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => loadFromStorage(STORAGE_KEYS.TOKEN, null));
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Persistence Effects ---
  useEffect(() => saveToStorage(STORAGE_KEYS.TASKS, tasks), [tasks]);
  useEffect(() => saveToStorage(STORAGE_KEYS.LISTS, lists), [lists]);
  useEffect(() => saveToStorage(STORAGE_KEYS.HABITS, habits), [habits]);
  useEffect(() => saveToStorage(STORAGE_KEYS.FOCUS, focusCategories), [focusCategories]);
  useEffect(() => saveToStorage(STORAGE_KEYS.FOCUS_SESSIONS, focusSessions), [focusSessions]);
  useEffect(() => saveToStorage(STORAGE_KEYS.SETTINGS, settings), [settings]);
  useEffect(() => saveToStorage(STORAGE_KEYS.TOKEN, accessToken), [accessToken]);

  // --- Firebase Init ---
  useEffect(() => {
      // Basic init
      const success = initFirebase();
      setIsFirebaseReady(success);
  }, []);

  // --- Notification & Alarm System ---
  useEffect(() => {
      // Request permission on mount
      requestNotificationPermission();

      const checkReminders = () => {
          const now = new Date();
          tasks.forEach(task => {
              if (task.isCompleted || task.isDeleted) return;

              // Check specific reminder time OR due date time if not all day
              let triggerDate: Date | undefined;
              
              if (task.reminder) {
                  triggerDate = new Date(task.reminder);
              } else if (task.dueDate && !task.isAllDay) {
                  triggerDate = new Date(task.dueDate);
              }

              if (triggerDate && isSameMinute(now, triggerDate)) {
                  // Trigger Alarm
                  sendNotification(task.title, task.description || "It's time!");
                  playAlarmSound();
              }
          });
      };

      const intervalId = setInterval(checkReminders, 60000); // Check every minute
      return () => clearInterval(intervalId);
  }, [tasks]);


  // Responsive sidebar check
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
          } else {
              setIsSidebarOpen(true);
          }
      };
      // Initial check
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Handlers ---
  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map(t => {
        if (t.id === taskId) {
            if (t.isNote) return t;
            return { ...t, isCompleted: !t.isCompleted };
        }
        return t;
    }));
  };

  const handleAddTask = async (task: Task) => {
      // Optimistic update
      setTasks(prev => [task, ...prev]);
      
      if (accessToken) {
          try {
              const gcalEvent = await createCalendarEvent(accessToken, task);
              // Update local task with GCal ID to establish link
              if (gcalEvent && gcalEvent.id) {
                  setTasks(prev => prev.map(t => t.id === task.id ? { ...t, externalId: gcalEvent.id } : t));
              }
          } catch (e) {
              console.error("Failed to sync to GCal", e);
              sendNotification("Sync Failed", "Could not save task to Google Calendar. Check connection.");
          }
      }
  };
  
  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    
    // Sync update to GCal if linked
    if (accessToken && updatedTask.externalId) {
        try {
            await updateCalendarEvent(accessToken, updatedTask);
        } catch (e) {
            console.error("Failed to update GCal event", e);
        }
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, isDeleted: true } : t));
    if (selectedTaskId === taskId) setSelectedTaskId(null);
  };

  const handlePermanentDeleteTask = (taskId: string) => {
      setTasks(tasks.filter(t => t.id !== taskId));
      if (selectedTaskId === taskId) setSelectedTaskId(null);
  };

  const handleLinkTask = (childTaskId: string, parentTaskId: string) => {
      const childTask = tasks.find(t => t.id === childTaskId);
      const parentTask = tasks.find(t => t.id === parentTaskId);
      
      if (!childTask || !parentTask) return;

      // Create new subtask from the child task
      const newSubtask: Subtask = {
          id: childTask.id,
          title: childTask.title,
          isCompleted: childTask.isCompleted,
          dueDate: childTask.dueDate,
          isAllDay: childTask.isAllDay,
          priority: childTask.priority,
          tags: childTask.tags
      };

      // Update parent with new subtask
      const updatedParent = {
          ...parentTask,
          subtasks: [...(parentTask.subtasks || []), newSubtask]
      };

      // Remove child from main list and update parent
      setTasks(prev => prev
          .filter(t => t.id !== childTaskId)
          .map(t => t.id === parentTaskId ? updatedParent : t)
      );
      
      // Close detail view
      setSelectedTaskId(null);
  };

  const handleStartFocus = (taskId?: string) => {
    setFocusTaskId(taskId);
    setCurrentView(ViewType.Focus);
    setSelectedTaskId(null);
  };

  const handleFocusComplete = (duration: number, taskId?: string, categoryId?: string) => {
      const newSession: FocusSession = {
          id: Date.now().toString(),
          duration: duration,
          timestamp: new Date(),
          taskId,
          categoryId,
          taskTitle: taskId ? tasks.find(t => t.id === taskId)?.title : undefined
      };
      setFocusSessions(prev => [newSession, ...prev]);
      
      setSettings(prev => ({
          ...prev,
          stats: {
              ...prev.stats,
              karmaScore: (prev.stats?.karmaScore || 0) + (duration * 2),
              totalFocusMinutes: (prev.stats?.totalFocusMinutes || 0) + duration,
              level: prev.stats?.level || 1,
              completedTaskCount: prev.stats?.completedTaskCount || 0
          }
      }));
  };

  const handleToggleHabit = (habitId: string, dateStr: string) => {
      setHabits(habits.map(h => {
          if (h.id === habitId) {
              const newHistory = { ...h.history };
              if (newHistory[dateStr]?.completed) {
                  delete newHistory[dateStr];
              } else {
                  newHistory[dateStr] = { completed: true, timestamp: Date.now() };
              }
              return { ...h, history: newHistory };
          }
          return h;
      }));
  };

  const handleAddHabit = (habit: Habit) => {
      if (habits.find(h => h.id === habit.id)) {
          setHabits(habits.map(h => h.id === habit.id ? habit : h));
      } else {
          setHabits([...habits, habit]);
      }
  };

  const handleDeleteHabit = (habitId: string) => {
      setHabits(habits.filter(h => h.id !== habitId));
  };

  const handleAddList = (name: string, color: string) => {
      const newList: List = {
          id: Date.now().toString(),
          name,
          color
      };
      setLists([...lists, newList]);
  };

  const handleDeleteList = (listId: string) => {
      setLists(lists.filter(l => l.id !== listId));
      // Move tasks in this list to inbox to avoid data loss.
      setTasks(tasks.map(t => t.listId === listId ? { ...t, listId: 'inbox' } : t));
      if (currentView === listId) setCurrentView(ViewType.Inbox);
  };

  const handleSearch = (query: string) => {
      setSearchQuery(query);
  };

  const handleLogin = async () => {
    try {
      const { user, accessToken } = await loginWithGoogle();
      setUser(user);
      setAccessToken(accessToken);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
      await logoutUser();
      setUser(null);
      setAccessToken(null);
  };

  // --- Render Content Logic ---
  const renderContent = () => {
    if (currentView === ViewType.Habits) {
        return (
            <HabitView 
                habits={habits}
                onToggleHabit={handleToggleHabit}
                onAddHabit={handleAddHabit}
                onUpdateHabit={handleAddHabit}
                onDeleteHabit={handleDeleteHabit}
                onMenuClick={() => setIsSidebarOpen(true)}
                onOpenStats={() => setCurrentView(ViewType.HabitStats)}
            />
        );
    }

    if (currentView === ViewType.HabitStats) {
        return (
            <HabitStatsView 
                habits={habits}
                onClose={() => setCurrentView(ViewType.Habits)}
            />
        );
    }

    if (currentView === ViewType.Focus) {
        return (
            <FocusView 
                categories={focusCategories}
                onAddCategory={(cat) => setFocusCategories([...focusCategories, cat])}
                activeTask={focusTaskId ? tasks.find(t => t.id === focusTaskId) : undefined}
                onFocusComplete={handleFocusComplete}
                onMenuClick={() => setIsSidebarOpen(true)}
                focusSessions={focusSessions}
            />
        );
    }
    
    if (currentView === ViewType.Matrix) {
        return (
            <MatrixView 
                tasks={tasks}
                lists={lists}
                onMenuClick={() => setIsSidebarOpen(true)}
                onUpdateTask={handleUpdateTask}
                onAddTask={handleAddTask}
            />
        );
    }

    if (currentView === ViewType.Calendar) {
        return (
            <CalendarView 
                tasks={tasks}
                lists={lists}
                habits={habits}
                accessToken={accessToken}
                onToggleTask={handleToggleTask}
                onSelectTask={setSelectedTaskId}
                onUpdateTask={handleUpdateTask}
                onMenuClick={() => setIsSidebarOpen(true)}
                onConnectGCal={handleLogin}
                onTokenExpired={handleLogout}
            />
        );
    }

    if (currentView === ViewType.Kanban) {
        return (
            <KanbanView 
                tasks={tasks}
                lists={lists}
                onToggleTask={handleToggleTask}
                onSelectTask={setSelectedTaskId}
                onMenuClick={() => setIsSidebarOpen(true)}
                onAddTask={handleAddTask}
            />
        );
    }

    if (currentView === ViewType.Tags) {
        return (
            <TagsView 
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onSelectTask={setSelectedTaskId}
                onMenuClick={() => setIsSidebarOpen(true)}
            />
        );
    }

    return (
        <TaskView 
            tasks={tasks}
            lists={lists}
            viewType={currentView}
            searchQuery={searchQuery}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onSelectTask={setSelectedTaskId}
            onDeleteTask={handleDeleteTask}
            onMenuClick={() => setIsSidebarOpen(true)}
        />
    );
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar 
          currentView={currentView as ViewType} 
          onChangeView={(view) => {
              setCurrentView(view);
              if (view !== ViewType.Search) {
                  setSearchQuery('');
              }
          }}
          lists={lists}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onAddList={handleAddList}
          onDeleteList={handleDeleteList}
          onOpenSettings={() => setShowSettings(true)}
          onSearch={handleSearch}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {renderContent()}
      </div>

      {/* Task Detail Panel (Slide Over) */}
      {selectedTaskId && (
          <div className="absolute inset-0 z-40 bg-white md:bg-black/20 flex justify-end animate-in slide-in-from-right duration-200">
              <div 
                  className="absolute inset-0 md:hidden bg-black/20" 
                  onClick={() => setSelectedTaskId(null)}
              />
              <div className="w-full md:w-[480px] h-full bg-white shadow-2xl relative flex flex-col md:rounded-l-2xl overflow-hidden">
                  {(() => {
                      const task = tasks.find(t => t.id === selectedTaskId);
                      if (!task) return null;
                      return (
                          <TaskDetailView 
                              task={task}
                              lists={lists}
                              tasks={tasks}
                              onClose={() => setSelectedTaskId(null)}
                              onUpdateTask={handleUpdateTask}
                              onDeleteTask={handleDeleteTask}
                              onStartFocus={handleStartFocus}
                              onPermanentDelete={handlePermanentDeleteTask}
                              onLinkTask={handleLinkTask}
                          />
                      );
                  })()}
              </div>
          </div>
      )}

      {/* Settings Modal (Simplified) */}
      {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-slate-800">Account & Settings</h2>
                      <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4">
                          {user ? (
                              <>
                                  <img src={user.photoURL} className="w-12 h-12 rounded-full" />
                                  <div className="flex-1">
                                      <div className="font-bold text-slate-800">{user.displayName}</div>
                                      <div className="text-xs text-slate-500">{user.email}</div>
                                  </div>
                                  <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 p-2">
                                      <LogOut size={20} />
                                  </button>
                              </>
                          ) : (
                              <div className="flex-1 text-center py-2">
                                  <p className="text-sm text-slate-500 mb-3">Sign in to sync with Google Calendar</p>
                                  <button onClick={handleLogin} className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
                                      Sign in with Google
                                  </button>
                              </div>
                          )}
                      </div>
                      
                      {/* Placeholder for other settings */}
                      <div className="space-y-2">
                          <h3 className="text-sm font-bold text-slate-400 uppercase">General</h3>
                          <div className="p-3 bg-white border border-slate-100 rounded-xl text-slate-600 flex justify-between cursor-pointer hover:bg-slate-50">
                              <span>Theme</span>
                              <span className="text-blue-500 font-medium">System</span>
                          </div>
                           <div className="p-3 bg-white border border-slate-100 rounded-xl text-slate-600 flex justify-between cursor-pointer hover:bg-slate-50">
                              <span>Smart Parsing</span>
                              <span className="text-blue-500 font-medium">On</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
