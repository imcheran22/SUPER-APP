
export enum Priority {
  None = 0,
  Low = 1,
  Medium = 2,
  High = 3
}

export enum ViewType {
  Inbox = 'inbox',
  Today = 'today',
  Next7Days = 'next7days',
  Calendar = 'calendar',
  Matrix = 'matrix',
  Kanban = 'kanban',
  Focus = 'focus',
  Habits = 'habits',
  HabitStats = 'habitStats',
  Tags = 'tags',
  Completed = 'completed',
  Trash = 'trash',
  Search = 'search',
  All = 'all'
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: Date;
  isAllDay?: boolean;
  priority?: Priority;
  tags?: string[];
}

export interface TaskLocation {
  name: string;
  lat?: number;
  lng?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: Priority;
  listId: string;
  tags: string[];
  dueDate?: Date;
  endDate?: Date;
  duration?: number; // in minutes
  isAllDay?: boolean;
  subtasks: Subtask[];
  attachments: { id: string; title: string; type: 'image' | 'file'; url: string }[];
  isNote?: boolean;
  isDeleted?: boolean;
  reminder?: Date;
  externalId?: string; // For Google Calendar sync
  createdAt?: Date;
  isPinned?: boolean;
  isWontDo?: boolean;
  repeat?: string;
  location?: TaskLocation;
}

export interface List {
  id: string;
  name: string;
  color: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  quote?: string;
  goal?: number;
  frequencyType?: 'daily' | 'weekly' | 'interval';
  frequencyDays?: number[]; // 0-6
  frequencyCount?: number;
  section?: 'Morning' | 'Afternoon' | 'Night' | 'Others';
  startDate?: Date;
  endDate?: Date;
  reminders?: string[];
  targetValue?: number;
  unit?: string;
  isArchived?: boolean;
  createdDate?: Date;
  history: Record<string, { completed: boolean; timestamp: number; mood?: string; note?: string }>;
}

export type HabitLog = Habit['history'][string];
export type HabitSection = NonNullable<Habit['section']>;
export type HabitFrequencyType = NonNullable<Habit['frequencyType']>;

export type TimerMode = 'pomo' | 'stopwatch';

export interface FocusCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  mode: TimerMode;
  defaultDuration: number;
}

export interface FocusSession {
  id: string;
  duration: number; // minutes
  timestamp: Date;
  taskId?: string;
  taskTitle?: string;
  categoryId?: string;
}

export interface AppSettings {
  userName?: string;
  theme?: 'light' | 'dark';
  themeColor?: string;
  stats?: {
    karmaScore: number;
    totalFocusMinutes: number;
    level: number;
    completedTaskCount: number;
  };
}
