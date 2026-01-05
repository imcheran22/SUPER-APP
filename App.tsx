import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TaskView from './components/TaskView';
import TaskDetailView from './components/TaskDetailView';
import HabitView from './components/HabitView';
import FocusView from './components/FocusView';
import MatrixView from './components/MatrixView';
import CalendarView from './components/CalendarView';
import HabitStatsView from './components/HabitStatsView';
import KanbanView from './components/KanbanView';
import TagsView from './components/TagsView';
import { HabitReminderSheet } from './components/HabitReminderSheet';
import { ThemeStep } from './components/ThemeStep';
import { ListStep } from './components/ListStep';
import { Task, Priority, ViewType, Habit, FocusCategory, List, AppSettings, FocusSession, Subtask } from './types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './services/storageService';
import { initFirebase, loginWithGoogle, logoutUser } from './services/firebaseService';
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent } from './services/googleCalendarService';
import { requestNotificationPermission, sendNotification, playAlarmSound } from './services/notificationService';
import { X, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import { isSameMinute, format } from 'date-fns';

const PRESET_LISTS = [
    { id: 'Work', color: '#3b82f6' },
    { id: 'Personal', color: '#10b981' },
    { id: 'Shopping', color: '#f59e0b' },
    { id: 'Fitness', color: '#ef4444' },
    { id: 'Travel', color: '#8b5cf6' },
    { id: 'Reading', color: '#ec4899' },
];

const App: React.FC = () => {
  // --- Main App State ---
  const [currentView, setCurrentView] = useState<ViewType | string>(ViewType.Inbox);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage(STORAGE_KEYS.SETTINGS, {
      themeColor: 'blue'
  }));
  
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

  // --- Reminder State ---
  const [activeHabitForReminder, setActiveHabitForReminder] = useState<Habit | null>(null);
  const lastReminderTimeRef = useRef<string | null>(null);

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
          const nowStr = format(now, 'HH:mm');
          
          // Avoid triggering multiple times in the same minute
          if (lastReminderTimeRef.current === nowStr) return;
          
          let notificationSent = false;

          // 1. Task Reminders
          tasks.forEach(task => {
              if (task.isCompleted || task.isDeleted) return;

              let triggerDate: Date | undefined;
              if (task.reminder) {
                  triggerDate = new Date(task.reminder);
              } else if (task.dueDate && !task.isAllDay) {
                  triggerDate = new Date(task.dueDate);
              }

              if (triggerDate && isSameMinute(now, triggerDate)) {
                  sendNotification(task.title, task.description || "It's time!");
                  if (!notificationSent) {
                      playAlarmSound();
                      notificationSent = true;
                  }
              }
          });

          // 2. Habit Reminders
          habits.forEach(habit => {
              if (habit.isArchived) return;
              if (habit.reminders?.includes(nowStr)) {
                  const todayStr = format(now, 'yyyy-MM-dd');
                  // Only remind if not completed today
                  if (!habit.history[todayStr]?.completed) {
                      setActiveHabitForReminder(habit);
                      sendNotification(habit.name, habit.quote || "Time for your habit!");
                      if (!notificationSent) {
                          playAlarmSound();
                          notificationSent = true;
                      }
                  }
              }
          });
          
          if (notificationSent || activeHabitForReminder) {
             lastReminderTimeRef.current = nowStr;
          }
      };

      const intervalId = setInterval(checkReminders, 10000); // Check every 10s to hit the minute
      return () => clearInterval(intervalId);
  }, [tasks, habits]);


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
      
      if (currentView === listId) {
          setCurrentView(ViewType.Inbox);
      }
  };

  const handleLogin = async () => {
      try {
          const result = await loginWithGoogle();
          setUser(result.user);
          setAccessToken(result.accessToken || null);
          setSettings(prev => ({ ...prev, userName: result.user.displayName || '' }));
      } catch (e: any) {
          alert(`Login failed: ${e.message}`);
          console.error(e);
      }
  };

  const handleGCalConnect = async () => {
      setIsSyncing(true);
      try {
          const result = await loginWithGoogle();
          setUser(result.user);
          setAccessToken(result.accessToken || null);
          setSettings(prev => ({ ...prev, userName: result.user.displayName || '' }));
      } catch (e: any) {
          console.error("GCal Connect Error", e);
          alert(`Failed to connect Google Calendar: ${e.message}`);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleTokenExpired = () => {
      setAccessToken(null);
      saveToStorage(STORAGE_KEYS.TOKEN, null);
  };

  const handleLogout = async () => {
      await logoutUser();
      setUser(null);
      setAccessToken(null);
      saveToStorage(STORAGE_KEYS.TOKEN, null);
  }

  const activeTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="flex w-screen bg-slate-50 overflow-hidden font-sans text-slate-900 selection:bg-blue-100 h-[100dvh]">
      {/* Sidebar */}
      <Sidebar 
          currentView={currentView as ViewType}
          onChangeView={(view) => {
              setCurrentView(view);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
              setSelectedTaskId(null);
          }}
          lists={lists}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenSettings={() => setShowSettings(true)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onAddList={handleAddList}
          onDeleteList={handleDeleteList}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-0' : ''} relative min-w-0`}>
          
          <div className="flex-1 overflow-hidden relative">
            {currentView === ViewType.Habits && (
                <HabitView 
                    habits={habits}
                    onToggleHabit={handleToggleHabit}
                    onUpdateHabit={handleAddHabit}
                    onAddHabit={handleAddHabit}
                    onDeleteHabit={handleDeleteHabit}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onOpenStats={() => setCurrentView(ViewType.HabitStats)}
                />
            )}
            {currentView === ViewType.HabitStats && (
                <HabitStatsView 
                    habits={habits}
                    onClose={() => setCurrentView(ViewType.Habits)}
                />
            )}
            {currentView === ViewType.Focus && (
                <FocusView 
                    categories={focusCategories}
                    onAddCategory={(c) => setFocusCategories([...focusCategories, c])}
                    activeTask={tasks.find(t => t.id === focusTaskId)}
                    onFocusComplete={handleFocusComplete}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    focusSessions={focusSessions}
                />
            )}
            {currentView === ViewType.Matrix && (
                <MatrixView 
                    tasks={tasks} 
                    lists={lists}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onUpdateTask={handleUpdateTask}
                    onAddTask={handleAddTask}
                />
            )}
            {currentView === ViewType.Calendar && (
                <CalendarView 
                    tasks={tasks}
                    lists={lists}
                    habits={habits}
                    accessToken={accessToken}
                    onToggleTask={handleToggleTask}
                    onSelectTask={(id) => setSelectedTaskId(id)}
                    onUpdateTask={handleUpdateTask}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onConnectGCal={handleGCalConnect}
                    onTokenExpired={handleTokenExpired}
                />
            )}
            {currentView === ViewType.Kanban && (
                <KanbanView
                    tasks={tasks}
                    lists={lists}
                    onToggleTask={handleToggleTask}
                    onSelectTask={(id) => setSelectedTaskId(id)}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onAddTask={handleAddTask}
                />
            )}
            {currentView === ViewType.Tags && (
                <TagsView 
                    tasks={tasks}
                    onToggleTask={handleToggleTask}
                    onSelectTask={(id) => setSelectedTaskId(id)}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
            )}
            {![ViewType.Habits, ViewType.HabitStats, ViewType.Focus, ViewType.Matrix, ViewType.Calendar, ViewType.Kanban, ViewType.Tags].includes(currentView as any) && (
                <TaskView 
                    tasks={tasks} 
                    lists={lists} 
                    viewType={currentView}
                    searchQuery={searchQuery}
                    onToggleTask={handleToggleTask}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask} 
                    onSelectTask={(id) => setSelectedTaskId(id)}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
            )}
          </div>
      </div>

      {/* Detail View - Fixed Positioning for Overlay over Boards */}
      {selectedTaskId && activeTask && (
         <div className="fixed inset-y-0 right-0 w-full md:w-[450px] z-50 shadow-2xl bg-white border-l border-slate-200 animate-in slide-in-from-right duration-300 md:duration-200">
             <TaskDetailView 
                task={activeTask}
                tasks={tasks}
                lists={lists}
                onClose={() => setSelectedTaskId(null)}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onPermanentDelete={handlePermanentDeleteTask}
                onStartFocus={handleStartFocus}
                onLinkTask={handleLinkTask}
             />
         </div>
      )}

      {/* Habit Reminder Sheet Overlay */}
      {activeHabitForReminder && (
         <HabitReminderSheet
             habit={activeHabitForReminder}
             onClose={() => setActiveHabitForReminder(null)}
             onCheckIn={() => {
                 const todayStr = format(new Date(), 'yyyy-MM-dd');
                 handleToggleHabit(activeHabitForReminder.id, todayStr);
                 setActiveHabitForReminder(null);
             }}
             onFocus={() => {
                 setCurrentView(ViewType.Focus);
                 setActiveHabitForReminder(null);
             }}
         />
      )}

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-slate-800">Settings</h2>
                      <button onClick={() => setShowSettings(false)}><X className="text-slate-400"/></button>
                  </div>
                  <div className="space-y-6">
                      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          {user || accessToken ? (
                             <>
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">G</div>
                                )}
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800">{user?.displayName || "Google User"}</div>
                                    <div className="text-xs text-slate-500">{user?.email || "Connected via Token"}</div>
                                </div>
                                <button onClick={handleLogout} className="text-red-500 p-2"><LogOut size={20}/></button>
                             </>
                          ) : (
                              <button onClick={handleLogin} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                                  <span>Sign in with Google</span>
                              </button>
                          )}
                      </div>

                      <ThemeStep 
                         selected={settings.themeColor || 'blue'} 
                         onSelect={(color) => setSettings({ ...settings, themeColor: color })}
                      />

                      <div className="border-t border-slate-100 pt-4">
                          <ListStep 
                              selected={lists.map(l => l.name)}
                              onToggle={(name) => {
                                  const existing = lists.find(l => l.name === name);
                                  if (existing) {
                                      handleDeleteList(existing.id);
                                  } else {
                                      const preset = PRESET_LISTS.find(p => p.id === name);
                                      if (preset) handleAddList(name, preset.color);
                                  }
                              }}
                          />
                      </div>

                      <div className="flex justify-end pt-2">
                           <button onClick={() => setShowSettings(false)} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors">
                               Done
                           </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;