import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RotateCcw, Target, Coffee, Moon,
    Volume2, VolumeX, Flame, Timer, Plus, BarChart2,
    ChevronUp, Trash2, Maximize2, Minimize2
} from 'lucide-react';
import { cn } from '../lib/utils';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak' | 'custom' | 'stopwatch';

const DURATIONS: Record<string, number> = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
};

type Session = {
    id: string;
    type: TimerMode;
    startTime: number;
    duration: number;
    completed: boolean;
    label?: string;
};

/* ─── Audio helper ─── */
const playChimeSound = () => {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        [0, 0.25, 0.5].forEach((t, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = [523, 659, 784][i];
            gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + t);
            osc.stop(ctx.currentTime + t + 0.7);
        });
    } catch { /* ignore */ }
};

/* ─── Arc SVG circle ─── */
const TimerRing = ({
    progress, isRunning, mode, size = 280
}: { progress: number; isRunning: boolean; mode: TimerMode; size?: number }) => {
    const strokeW = size < 220 ? 5 : 6;
    const r = (size - strokeW * 2) / 2;
    const circ = 2 * Math.PI * r;
    const dash = circ * (1 - Math.max(0, Math.min(1, progress)));

    const color = mode === 'shortBreak' || mode === 'longBreak'
        ? '#34d399'   // emerald for breaks
        : mode === 'stopwatch'
            ? '#a855f7'   // purple for stopwatch
            : '#f97316';  // orange for focus

    return (
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
            {/* Track */}
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="rgba(255,255,255,0.04)"
                strokeWidth={strokeW}
            />
            {/* Progress */}
            <motion.circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={color}
                strokeWidth={strokeW}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={dash}
                style={{ filter: isRunning ? `drop-shadow(0 0 8px ${color}60)` : 'none' }}
                transition={{ type: 'tween', ease: 'linear', duration: 0.9 }}
            />
        </svg>
    );
};

const FocusTimer = () => {
    const [mode, setMode] = useState<TimerMode>('pomodoro');
    const [timeLeft, setTimeLeft] = useState(DURATIONS.pomodoro);
    const [totalDuration, setTotalDuration] = useState(DURATIONS.pomodoro);
    const [isRunning, setIsRunning] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editInput, setEditInput] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [pomodoroCount, setPomodoroCount] = useState(0);
    const sessionStartRef = useRef<number | null>(null);

    const [sessions, setSessions] = useState<Session[]>(() => {
        try {
            const s = localStorage.getItem('focus-sessions');
            return s ? JSON.parse(s) : [];
        } catch { return []; }
    });

    /* ── Persist sessions ── */
    const saveSessions = (updated: Session[]) => {
        setSessions(updated);
        localStorage.setItem('focus-sessions', JSON.stringify(updated));
    };

    /* ── Today focus analytics ── */
    const todaySessions = sessions.filter(s => {
        const today = new Date().setHours(0, 0, 0, 0);
        return s.startTime >= today && (s.type === 'pomodoro' || s.type === 'custom' || s.type === 'stopwatch');
    });
    const todayFocusSecs = todaySessions.reduce((a, c) => a + c.duration, 0);
    const focusHrs = Math.floor(todayFocusSecs / 3600);
    const focusMins = Math.floor((todayFocusSecs % 3600) / 60);

    /* ── Background-tab sync on mount ── */
    useEffect(() => {
        const savedMode = localStorage.getItem('timer-mode') as TimerMode | null;
        const savedRunning = localStorage.getItem('timer-running') === 'true';
        const endTime = localStorage.getItem('timer-end-time');
        const startTime = localStorage.getItem('timer-start-time');
        const savedCount = localStorage.getItem('pomodoro-count');

        if (savedCount) setPomodoroCount(parseInt(savedCount));
        if (savedMode) setMode(savedMode);

        if (savedRunning) {
            if (savedMode === 'stopwatch' && startTime) {
                const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
                setTimeLeft(elapsed);
                setTotalDuration(elapsed || 1);
                setIsRunning(true);
                sessionStartRef.current = parseInt(startTime);
            } else if (endTime) {
                const remaining = Math.round((parseInt(endTime) - Date.now()) / 1000);
                const dur = savedMode && DURATIONS[savedMode] ? DURATIONS[savedMode] : 25 * 60;
                setTotalDuration(dur);
                if (remaining > 0) {
                    setTimeLeft(remaining);
                    setIsRunning(true);
                    sessionStartRef.current = startTime ? parseInt(startTime) : Date.now() - (dur - remaining) * 1000;
                } else {
                    setTimeLeft(0);
                    if (soundEnabled) playChimeSound();
                }
            }
        } else {
            const savedLeft = localStorage.getItem('timer-time-left');
            const dur = savedMode && DURATIONS[savedMode] ? DURATIONS[savedMode] : 25 * 60;
            if (savedMode === 'stopwatch') setTimeLeft(savedLeft ? parseInt(savedLeft) : 0);
            else if (savedMode === 'custom' && savedLeft) { setTimeLeft(parseInt(savedLeft)); setTotalDuration(parseInt(savedLeft)); }
            else { setTimeLeft(dur); setTotalDuration(dur); }
        }
    }, []); // eslint-disable-line

    /* ── Add session ── */
    const addSession = useCallback((
        sessionMode: TimerMode, start: number, dur: number, completed: boolean
    ) => {
        const newS: Session = {
            id: crypto.randomUUID(),
            type: sessionMode,
            startTime: start,
            duration: Math.max(dur, 0),
            completed,
        };
        if (newS.duration >= 30) {
            setSessions(prev => {
                const updated = [...prev, newS];
                localStorage.setItem('focus-sessions', JSON.stringify(updated));
                return updated;
            });
        }
    }, []);

    /* ── Session complete ── */
    const handleComplete = useCallback(() => {
        setIsRunning(false);
        localStorage.setItem('timer-running', 'false');
        localStorage.removeItem('timer-end-time');
        if (soundEnabled) playChimeSound();

        if (sessionStartRef.current) {
            addSession(mode, sessionStartRef.current, totalDuration, true);
        }

        if (mode === 'pomodoro') {
            const newCount = pomodoroCount + 1;
            setPomodoroCount(newCount);
            localStorage.setItem('pomodoro-count', newCount.toString());
        }
        sessionStartRef.current = null;
    }, [mode, soundEnabled, addSession, totalDuration, pomodoroCount]);

    /* ── Timer tick ── */
    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (mode === 'stopwatch') {
                    const next = prev + 1;
                    localStorage.setItem('timer-time-left', next.toString());
                    return next;
                }
                const next = prev - 1;
                localStorage.setItem('timer-time-left', next.toString());
                if (next <= 0) { handleComplete(); return 0; }
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isRunning, mode, handleComplete]);

    /* ── Toggle play/pause ── */
    const toggleTimer = () => {
        if (isRunning) {
            setIsRunning(false);
            localStorage.setItem('timer-running', 'false');
            // Save partial session for stopwatch
            if (mode === 'stopwatch' && sessionStartRef.current) {
                addSession('stopwatch', sessionStartRef.current, timeLeft, false);
                sessionStartRef.current = null;
            }
        } else {
            const start = Date.now();
            sessionStartRef.current = start;

            if (mode === 'stopwatch') {
                const startOffset = timeLeft > 0 ? Date.now() - timeLeft * 1000 : Date.now();
                localStorage.setItem('timer-start-time', startOffset.toString());
            } else {
                const dur = timeLeft > 0 ? timeLeft : totalDuration;
                localStorage.setItem('timer-duration-setting', dur.toString());
                localStorage.setItem('timer-start-time', start.toString());
                localStorage.setItem('timer-end-time', (start + dur * 1000).toString());
            }
            setIsRunning(true);
            localStorage.setItem('timer-running', 'true');
        }
    };

    /* ── Reset ── */
    const resetTimer = () => {
        setIsRunning(false);
        const dur = mode === 'stopwatch' ? 0 : (DURATIONS[mode] ?? totalDuration);
        setTimeLeft(dur);
        sessionStartRef.current = null;
        localStorage.setItem('timer-running', 'false');
        localStorage.setItem('timer-time-left', dur.toString());
        localStorage.removeItem('timer-end-time');
        localStorage.removeItem('timer-duration-setting');
        localStorage.removeItem('timer-start-time');
    };

    /* ── Switch mode ── */
    const switchMode = (newMode: TimerMode) => {
        if (isRunning && !confirm('Timer is running. Switch mode?')) return;
        setMode(newMode);
        setIsRunning(false);
        localStorage.setItem('timer-mode', newMode);
        localStorage.setItem('timer-running', 'false');
        sessionStartRef.current = null;

        const dur = newMode === 'stopwatch' ? 0 : (DURATIONS[newMode] ?? 25 * 60);
        setTimeLeft(dur);
        setTotalDuration(dur || 1);
        localStorage.setItem('timer-time-left', dur.toString());
        localStorage.removeItem('timer-end-time');
    };

    /* ── Adjust duration ± ── */
    const adjustTime = (deltaMins: number) => {
        if (isRunning) return;
        const delta = deltaMins * 60;
        const newDur = Math.max(60, timeLeft + delta);
        setTimeLeft(newDur);
        setTotalDuration(newDur);
        setMode('custom');
        localStorage.setItem('timer-mode', 'custom');
        localStorage.setItem('timer-time-left', newDur.toString());
    };

    /* ── Custom time submit ── */
    const handleEditSubmit = () => {
        const parts = editInput.split(':').map(p => parseInt(p.trim()));
        let secs = 0;
        if (parts.length === 2) secs = (parts[0] || 0) * 60 + (parts[1] || 0);
        else if (parts.length === 1 && !isNaN(parts[0])) secs = parts[0] * 60;

        if (secs > 0) {
            setTimeLeft(secs);
            setTotalDuration(secs);
            setMode('custom');
            localStorage.setItem('timer-mode', 'custom');
            localStorage.setItem('timer-time-left', secs.toString());
        }
        setIsEditing(false);
        setEditInput('');
    };

    /* ── Format time ── */
    const fmt = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return {
            display: `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
            sub: ''
        };
        return {
            display: `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
            sub: ''
        };
    };

    const progress = mode === 'stopwatch' ? 0 : (totalDuration > 0 ? timeLeft / totalDuration : 0);
    const { display } = fmt(timeLeft);
    const today = new Date();

    const accentColor = mode === 'shortBreak' || mode === 'longBreak'
        ? 'text-emerald-400'
        : mode === 'stopwatch'
            ? 'text-purple-400'
            : 'text-orange-400';

    const accentBg = mode === 'shortBreak' || mode === 'longBreak'
        ? 'bg-emerald-500'
        : mode === 'stopwatch'
            ? 'bg-purple-500'
            : 'bg-orange-500';

    const [isFull, setIsFull] = useState(false);

    // ESC to exit fullscreen
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFull(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const modes = [
        { id: 'pomodoro' as TimerMode, label: 'Focus', icon: Target, time: '25m' },
        { id: 'shortBreak' as TimerMode, label: 'Short', icon: Coffee, time: '5m' },
        { id: 'longBreak' as TimerMode, label: 'Long', icon: Moon, time: '15m' },
        { id: 'stopwatch' as TimerMode, label: 'Watch', icon: Timer, time: '∞' },
    ];

    /* ── Read In Orbit tasks for fullscreen ── */
    const orbitTasks = useMemo(() => {
        try {
            const all = JSON.parse(localStorage.getItem('kanban-tasks') || '[]');
            return all.filter((t: { status: string }) => t.status === 'doing');
        } catch { return []; }
    }, [isRunning]); // re-read when timer starts/stops

    /* ── Fullscreen overlay ── */
    if (isFull) return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-[#060606] flex flex-row"
        >
            {/* Ambient glow */}
            <div className={cn(
                "absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.06] pointer-events-none",
                mode === 'shortBreak' || mode === 'longBreak' ? 'bg-emerald-500' :
                    mode === 'stopwatch' ? 'bg-purple-500' : 'bg-orange-500'
            )} />

            {/* ── LEFT: Timer ── */}
            <div className="flex-1 flex flex-col items-center justify-center relative px-8">
                {/* Exit + ESC */}
                <button
                    onClick={() => setIsFull(false)}
                    className="absolute top-6 right-6 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-700 hover:text-zinc-200 transition-all"
                    title="Exit fullscreen (Esc)"
                >
                    <Minimize2 size={16} />
                </button>
                <p className="absolute top-7 left-6 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-800">Esc to exit</p>

                {/* Ring + time */}
                <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
                    <TimerRing progress={progress} isRunning={isRunning} mode={mode} size={320} />
                    <div className="flex flex-col items-center z-10">
                        <span className={cn(
                            "font-black tabular-nums text-zinc-100 leading-none",
                            display.length > 5 ? "text-5xl" : "text-6xl"
                        )}>
                            {display}
                        </span>
                        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] mt-3", accentColor)}>
                            {mode === 'pomodoro' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : mode === 'stopwatch' ? 'Stopwatch' : 'Custom'}
                        </span>
                        {mode === 'pomodoro' && (
                            <div className="flex gap-2 mt-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className={cn(
                                        "w-2 h-2 rounded-full transition-all",
                                        i < (pomodoroCount % 4) ? "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.7)]" : "bg-white/[0.07]"
                                    )} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 mt-8">
                    <button
                        onClick={resetTimer}
                        className="w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-all active:scale-90"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button
                        onClick={toggleTimer}
                        className={cn(
                            "w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl",
                            isRunning
                                ? "bg-white/[0.06] border border-white/10 text-zinc-200 hover:bg-white/[0.10]"
                                : cn("text-white", accentBg, "hover:opacity-90")
                        )}
                        style={!isRunning ? { boxShadow: `0 8px 32px rgba(${mode === 'shortBreak' || mode === 'longBreak' ? '52,211,153' : mode === 'stopwatch' ? '168,85,247' : '249,115,22'}, 0.35)` } : {}}
                    >
                        {isRunning ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-0.5" />}
                    </button>
                    <button
                        onClick={() => setSoundEnabled(s => !s)}
                        className="w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-all"
                    >
                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                </div>
            </div>

            {/* ── RIGHT: In Orbit tasks ── */}
            <div className="w-80 xl:w-96 border-l border-white/[0.05] flex flex-col bg-[#080808]/80 backdrop-blur-sm">
                {/* Header */}
                <div className="px-6 pt-8 pb-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.7)]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">In Orbit</p>
                        <span className="ml-auto text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md">
                            {orbitTasks.length}
                        </span>
                    </div>
                    <p className="text-[11px] text-zinc-700 font-medium">Tasks currently in progress</p>
                </div>

                {/* Task list */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 flex flex-col gap-2">
                    {orbitTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-3">
                                <Target size={20} className="text-zinc-800" />
                            </div>
                            <p className="text-[11px] font-bold text-zinc-700">No tasks in orbit</p>
                            <p className="text-[10px] text-zinc-800 mt-1">Move tasks to "Doing" on the Board</p>
                        </div>
                    ) : (
                        orbitTasks.map((task: { id: string; title: string; urgency: number; checklists?: { completed: boolean }[]; statusChangedAt: number }, idx: number) => {
                            const elapsed = Date.now() - task.statusChangedAt;
                            const elapsedStr = Math.floor(elapsed / 3600000) > 0
                                ? `${Math.floor(elapsed / 3600000)}h active`
                                : `${Math.floor(elapsed / 60000)}m active`;
                            const done = task.checklists?.filter(c => c.completed).length || 0;
                            const total = task.checklists?.length || 0;
                            const pct = total > 0 ? (done / total) * 100 : 0;

                            return (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.06 }}
                                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] hover:border-orange-500/10 transition-all"
                                >
                                    <p className="text-sm font-bold text-zinc-200 leading-snug mb-2">{task.title}</p>

                                    {/* Urgency + time row */}
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border",
                                            task.urgency >= 5 ? "bg-red-500/15 text-red-400 border-red-500/20" :
                                                task.urgency >= 4 ? "bg-orange-500/15 text-orange-400 border-orange-500/20" :
                                                    task.urgency >= 3 ? "bg-amber-500/10 text-amber-500 border-amber-500/15" :
                                                        "bg-zinc-800 text-zinc-600 border-zinc-700/50"
                                        )}>
                                            {task.urgency >= 5 ? 'Critical' : task.urgency >= 4 ? 'High' : task.urgency >= 3 ? 'Medium' : 'Low'}
                                        </span>
                                        <span className="flex items-center gap-1 text-[8px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/15 px-1.5 py-0.5 rounded-md ml-auto">
                                            ⏱ {elapsedStr}
                                        </span>
                                    </div>

                                    {/* Checklist progress */}
                                    {total > 0 && (
                                        <div>
                                            <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="text-[8px] text-zinc-700 mt-1 font-medium">{done}/{total} subtasks</p>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Footer reminder */}
                {isRunning && (
                    <div className="px-5 py-4 border-t border-white/[0.04]">
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-500/5 border border-orange-500/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <p className="text-[9px] font-bold text-orange-400/70">Timer running — stay focused</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
            {/* ── Main layout: two-column on desktop, stacked on mobile ── */}
            <div className="min-h-full flex flex-col lg:flex-row">

                {/* ════ LEFT / TOP PANEL — Timer ════ */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 lg:py-0 lg:min-h-full relative">
                    {/* Ambient glow */}
                    <div className={cn(
                        "absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] opacity-10 pointer-events-none",
                        mode === 'shortBreak' || mode === 'longBreak' ? 'bg-emerald-500' :
                            mode === 'stopwatch' ? 'bg-purple-500' : 'bg-orange-500'
                    )} />

                    <div className="relative z-10 flex flex-col items-center w-full max-w-sm">

                        {/* Date + sound + fullscreen */}
                        <div className="flex items-center justify-between w-full mb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-700">
                                    {today.toLocaleString('default', { weekday: 'long' })}
                                </p>
                                <p className="text-zinc-400 text-sm font-semibold mt-0.5">
                                    {today.toLocaleString('default', { month: 'long' })} {today.getDate()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSoundEnabled(s => !s)}
                                    className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-600 hover:text-zinc-300 transition-all"
                                >
                                    {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                </button>
                                <button
                                    onClick={() => setIsFull(true)}
                                    className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-600 hover:text-orange-400 hover:border-orange-500/20 transition-all"
                                    title="Fullscreen timer"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Mode tabs */}
                        <div className="flex gap-0.5 bg-white/[0.03] border border-white/[0.06] p-1 rounded-2xl mb-8 w-full">
                            {modes.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => switchMode(m.id)}
                                    className={cn(
                                        "flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all",
                                        mode === m.id
                                            ? cn("text-white", accentBg + '/15', "border border-white/10")
                                            : "text-zinc-700 hover:text-zinc-500"
                                    )}
                                >
                                    {mode === m.id && (
                                        <motion.div
                                            layoutId="modeTab"
                                            className="absolute inset-0 rounded-xl"
                                            style={{ zIndex: -1 }}
                                        />
                                    )}
                                    <m.icon size={12} className={mode === m.id ? accentColor : ''} />
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* ── Ring + Timer display ── */}
                        <div className="relative flex flex-col items-center">
                            {/* Ring */}
                            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-6">
                                <TimerRing
                                    progress={progress}
                                    isRunning={isRunning}
                                    mode={mode}
                                    size={288}
                                />

                                {/* Center content */}
                                <div className="flex flex-col items-center text-center z-10">
                                    {isEditing ? (
                                        <input
                                            autoFocus
                                            type="text"
                                            value={editInput}
                                            onChange={e => setEditInput(e.target.value)}
                                            onBlur={handleEditSubmit}
                                            onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') setIsEditing(false); }}
                                            placeholder="25:00"
                                            className="w-36 text-4xl font-black bg-transparent text-center outline-none text-zinc-200 border-b-2 border-orange-500/60 pb-1"
                                        />
                                    ) : (
                                        <motion.span
                                            key={display}
                                            initial={{ opacity: 0.6, scale: 0.97 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={cn(
                                                "font-black tabular-nums text-zinc-100 leading-none",
                                                display.length > 5 ? "text-4xl" : "text-5xl sm:text-6xl"
                                            )}
                                            onClick={() => {
                                                if (!isRunning && mode !== 'stopwatch') {
                                                    setIsEditing(true);
                                                    setEditInput(fmt(timeLeft).display);
                                                }
                                            }}
                                        >
                                            {display}
                                        </motion.span>
                                    )}

                                    {/* Mode label */}
                                    <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] mt-2", accentColor)}>
                                        {mode === 'pomodoro' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : mode === 'stopwatch' ? 'Stopwatch' : 'Custom'}
                                    </span>

                                    {/* Pomodoro dots */}
                                    {mode === 'pomodoro' && (
                                        <div className="flex gap-1.5 mt-3">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div key={i} className={cn(
                                                    "w-2 h-2 rounded-full transition-all",
                                                    i < (pomodoroCount % 4)
                                                        ? "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]"
                                                        : "bg-white/[0.08]"
                                                )} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ± adjust buttons (only for countdown modes) */}
                            {mode !== 'stopwatch' && !isRunning && (
                                <div className="flex items-center gap-3 mb-4">
                                    {[-5, -1, 1, 5].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => adjustTime(d)}
                                            className={cn(
                                                "text-[10px] font-black px-2.5 py-1.5 rounded-xl border transition-all",
                                                d > 0
                                                    ? "border-white/[0.08] text-zinc-500 hover:text-zinc-200 hover:border-white/20"
                                                    : "border-white/[0.06] text-zinc-700 hover:text-zinc-400 hover:border-white/10"
                                            )}
                                        >
                                            {d > 0 ? '+' : ''}{d}m
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Controls */}
                            <div className="flex items-center gap-4">
                                {/* Reset */}
                                <button
                                    onClick={resetTimer}
                                    className="w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:border-white/20 transition-all active:scale-90"
                                >
                                    <RotateCcw size={16} />
                                </button>

                                {/* Play/Pause */}
                                <button
                                    onClick={toggleTimer}
                                    className={cn(
                                        "w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl font-bold",
                                        isRunning
                                            ? "bg-white/[0.07] border border-white/[0.12] text-zinc-200 hover:bg-white/[0.10]"
                                            : cn("text-white shadow-lg", accentBg, "hover:opacity-90")
                                    )}
                                    style={!isRunning ? { boxShadow: `0 8px 30px rgba(${mode === 'shortBreak' || mode === 'longBreak' ? '52,211,153' : mode === 'stopwatch' ? '168,85,247' : '249,115,22'}, 0.3)` } : {}}
                                >
                                    {isRunning
                                        ? <Pause size={22} className="fill-current" />
                                        : <Play size={22} className="fill-current ml-0.5" />
                                    }
                                </button>

                                {/* +/- toggle quick */}
                                <button
                                    onClick={() => adjustTime(mode !== 'stopwatch' ? 5 : 0)}
                                    className="w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:border-white/20 transition-all active:scale-90"
                                    title="Add 5 minutes"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ════ RIGHT / BOTTOM PANEL — Stats + History ════ */}
                <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/[0.05] flex flex-col bg-[#0d0d0d]">

                    {/* ── Today Stats ── */}
                    <div className="p-5 border-b border-white/[0.05]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">
                                Today's Focus
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <Flame size={12} className={isRunning && mode === 'pomodoro' ? "text-orange-500 animate-pulse" : "text-zinc-700"} />
                                <span className="text-[11px] font-black text-zinc-400">
                                    {focusHrs > 0 && `${focusHrs}h `}{focusMins}m
                                </span>
                            </div>
                        </div>

                        {/* Progress bar toward goal (4h) */}
                        <div className="mb-3">
                            <div className="flex justify-between text-[9px] text-zinc-700 mb-1.5 font-bold uppercase tracking-widest">
                                <span>Focus goal</span>
                                <span>{Math.min(100, Math.round(todayFocusSecs / (4 * 3600) * 100))}%</span>
                            </div>
                            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                                    animate={{ width: `${Math.min(100, (todayFocusSecs / (4 * 3600)) * 100)}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                />
                            </div>
                            <p className="text-[9px] text-zinc-800 mt-1">4h daily target</p>
                        </div>

                        {/* Stat chips */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                {
                                    label: 'Pomodoros',
                                    value: pomodoroCount % 4 || (pomodoroCount > 0 ? 4 : 0),
                                    sub: `${Math.floor(pomodoroCount / 4)} sets`,
                                    color: 'text-orange-400'
                                },
                                {
                                    label: 'Sessions',
                                    value: todaySessions.length,
                                    sub: 'today',
                                    color: 'text-zinc-300'
                                },
                                {
                                    label: 'Streak',
                                    value: `${Math.max(1, Math.floor(todayFocusSecs / 3600))}`,
                                    sub: 'hrs/day',
                                    color: 'text-purple-400'
                                },
                            ].map(s => (
                                <div key={s.label} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 text-center">
                                    <p className={cn("text-lg font-black", s.color)}>{s.value}</p>
                                    <p className="text-[8px] text-zinc-700 uppercase tracking-widest font-bold">{s.label}</p>
                                    <p className="text-[8px] text-zinc-800 mt-0.5">{s.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Session timeline bar ── */}
                    {todaySessions.length > 0 && (
                        <div className="px-5 py-4 border-b border-white/[0.05]">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 mb-3">Session timeline</p>
                            <div className="flex h-3 w-full rounded-full bg-white/[0.04] overflow-hidden gap-px">
                                {todaySessions.slice(-12).map(s => (
                                    <div
                                        key={s.id}
                                        title={`${s.type} · ${Math.round(s.duration / 60)}m`}
                                        className={cn(
                                            "h-full rounded-sm transition-all",
                                            s.type === 'stopwatch' ? "bg-purple-500/60" :
                                                s.type === 'shortBreak' || s.type === 'longBreak' ? "bg-emerald-500/60" :
                                                    s.completed ? "bg-orange-500" : "bg-orange-500/40"
                                        )}
                                        style={{ flexGrow: Math.max(s.duration / 60, 1) }}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between text-[8px] text-zinc-800 mt-1 font-mono">
                                <span>Start</span><span>Now</span>
                            </div>
                        </div>
                    )}

                    {/* ── Session History ── */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <button
                            onClick={() => setShowHistory(h => !h)}
                            className="flex items-center justify-between px-5 py-3.5 text-left border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors w-full"
                        >
                            <div className="flex items-center gap-2.5">
                                <BarChart2 size={13} className="text-zinc-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-600">History</span>
                                {sessions.length > 0 && (
                                    <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-white/[0.05] text-zinc-700 font-bold">
                                        {sessions.length}
                                    </span>
                                )}
                            </div>
                            <ChevronUp
                                size={14}
                                className={cn("text-zinc-700 transition-transform", !showHistory && "rotate-180")}
                            />
                        </button>

                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden flex-1"
                                >
                                    <div className="overflow-y-auto custom-scrollbar max-h-72 px-4 py-3 flex flex-col gap-1.5">
                                        {sessions.length === 0 && (
                                            <p className="text-[10px] text-zinc-800 text-center py-6 font-medium">
                                                No sessions recorded yet.
                                            </p>
                                        )}
                                        {[...sessions].reverse().map(s => {
                                            const d = Math.round(s.duration / 60);
                                            const time = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const isToday = s.startTime >= new Date().setHours(0, 0, 0, 0);
                                            return (
                                                <div
                                                    key={s.id}
                                                    className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group"
                                                >
                                                    <div className={cn(
                                                        "w-1.5 h-8 rounded-full flex-shrink-0",
                                                        s.type === 'stopwatch' ? "bg-purple-500/60" :
                                                            s.type === 'shortBreak' || s.type === 'longBreak' ? "bg-emerald-500/60" :
                                                                s.completed ? "bg-orange-500" : "bg-orange-500/30"
                                                    )} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-bold text-zinc-400 capitalize">{s.type}</p>
                                                        <p className="text-[9px] text-zinc-700">{time}{isToday ? ' · today' : ''}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-[11px] font-black text-zinc-400">{d}m</p>
                                                        {s.completed && <p className="text-[8px] text-emerald-500/60 font-bold">done</p>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {sessions.length > 0 && (
                                        <div className="px-5 pb-4">
                                            <button
                                                onClick={() => { if (confirm('Clear all session history?')) saveSessions([]); }}
                                                className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-800 hover:text-red-400 uppercase tracking-widest transition-colors"
                                            >
                                                <Trash2 size={10} />
                                                Clear history
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Quick Presets ── */}
                    <div className="px-5 py-4 border-t border-white/[0.05]">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-800 mb-3">Quick Presets</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: '15m', mins: 15 },
                                { label: '25m', mins: 25 },
                                { label: '45m', mins: 45 },
                                { label: '60m', mins: 60 },
                                { label: '90m', mins: 90 },
                            ].map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => {
                                        if (isRunning && !confirm('Reset timer?')) return;
                                        const secs = p.mins * 60;
                                        setMode('custom');
                                        setTimeLeft(secs);
                                        setTotalDuration(secs);
                                        setIsRunning(false);
                                        localStorage.setItem('timer-mode', 'custom');
                                        localStorage.setItem('timer-time-left', secs.toString());
                                        localStorage.setItem('timer-running', 'false');
                                        sessionStartRef.current = null;
                                    }}
                                    className="px-3 py-1.5 text-[9px] font-black uppercase rounded-xl bg-white/[0.03] text-zinc-600 border border-white/[0.05] hover:bg-white/[0.06] hover:text-zinc-300 hover:border-white/10 transition-all"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocusTimer;
