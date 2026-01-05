import { Task } from '../types';

// Mock implementation to prevent crashes without real API keys
export const fetchCalendarEvents = async (token: string, start: Date, end: Date) => {
  console.log("Fetching calendar events...", start, end);
  return [];
};

export const createCalendarEvent = async (token: string, task: Task) => {
  console.log("Creating calendar event for task:", task.title);
  return { id: `gcal-${Date.now()}`, htmlLink: '#' };
};

export const updateCalendarEvent = async (token: string, task: Task) => {
  console.log("Updating calendar event:", task.externalId);
  return { id: task.externalId, htmlLink: '#' };
};