import React, { useState, useEffect } from 'react';
import { FocusCategory, Task, FocusSession } from '../types';
import { Play, Pause, Square, Menu, Coffee } from 'lucide-react';

interface FocusViewProps {
  categories: FocusCategory[];
  onAddCategory: (c: FocusCategory) => void;
  activeTask?: Task;
  onFocusComplete: (duration: number, taskId?: string, categoryId?: string) => void;
  onMenuClick: () => void;
  focusSessions: FocusSession[];
}

const FocusView: React.FC<FocusViewProps> = ({
  activeTask,
  onFocusComplete,
  onMenuClick,
  focusSessions
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'pomo' | 'break'>('pomo');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);

  useEffect(() => {
      let interval: any;
      if (isRunning && timeLeft > 0) {
          interval = setInterval(() => {
              setTimeLeft(prev => prev - 1);
          }, 1000);
      } else if (timeLeft === 0 && isRunning) {
          setIsRunning(false);
          if (mode === 'pomo') {
              onFocusComplete(totalTime / 60, activeTask?.id);
              // Switch to break
              setMode('break');
              setTimeLeft(5 * 60);
              setTotalTime(5 * 60);
              new Notification("Focus Complete!", { body: "Take a break." });
          } else {
              setMode('pomo');
              setTimeLeft(25 * 60);
              setTotalTime(25 * 60);
              new Notification("Break Over", { body: "Ready to focus?" });
          }
      }
      return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
      setIsRunning(false);
      setTimeLeft(mode === 'pomo' ? 25 * 60 : 5 * 60);
      setTotalTime(mode === 'pomo' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Simple stats
  const todaySessions = focusSessions.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString());
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="h-full flex flex-col bg-slate-50">
        <div className="p-4 flex items-center justify-between">
            <button onClick={onMenuClick} className="md:hidden text-slate-500"><Menu size={20}/></button>
            <div className="text-xl font-bold text-slate-700">Focus</div>
            <div className="w-8"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
            {activeTask && (
                <div className="mb-8 text-center bg-white px-6 py-3 rounded-full shadow-sm text-slate-700 font-medium border border-slate-100">
                    Focusing on: {activeTask.title}
                </div>
            )}

            <div className="relative w-72 h-72 mb-12">
                {/* SVG Circle Progress */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="144" cy="144" r="140" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <circle 
                        cx="144" cy="144" r="140" fill="none" stroke={mode === 'pomo' ? '#3b82f6' : '#10b981'} strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 140}
                        strokeDashoffset={2 * Math.PI * 140 * (1 - progress / 100)}
                        className="transition-all duration-1000 ease-linear"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-6xl font-bold text-slate-800 font-mono tracking-tighter">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="text-slate-500 mt-2 font-medium uppercase tracking-widest text-sm flex items-center gap-2">
                        {mode === 'pomo' ? 'Focus' : <><Coffee size={16}/> Break</>}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                 {!isRunning && progress === 0 ? (
                     <button onClick={toggleTimer} className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all hover:scale-105">
                         <Play size={32} fill="currentColor" className="ml-1" />
                     </button>
                 ) : (
                    <>
                        {isRunning ? (
                             <button onClick={toggleTimer} className="w-16 h-16 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-300">
                                 <Pause size={24} fill="currentColor" />
                             </button>
                        ) : (
                             <button onClick={toggleTimer} className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 shadow-lg">
                                 <Play size={24} fill="currentColor" className="ml-1" />
                             </button>
                        )}
                        <button onClick={resetTimer} className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200">
                            <Square size={24} fill="currentColor" />
                        </button>
                    </>
                 )}
            </div>
        </div>

        <div className="p-8 text-center text-slate-500">
             <div className="text-3xl font-bold text-slate-800">{Math.round(todayMinutes)}</div>
             <div className="text-xs uppercase tracking-wider">Minutes Today</div>
        </div>
    </div>
  );
};

export default FocusView;