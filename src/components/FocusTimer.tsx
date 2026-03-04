import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RotateCcw, Target, Coffee, Moon,
    Volume2, VolumeX, Flame, Timer, Plus, BarChart2,
    ChevronDown, Trash2, Maximize2, Minimize2
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
};

/* ─── Audio ─── */
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
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.7);
        });
    } catch { /* ignore */ }
};

/* ─── SVG Ring ─── */
const TimerRing = ({ progress, isRunning, mode, size = 240 }: {
    progress: number; isRunning: boolean; mode: TimerMode; size?: number;
}) => {
    const sw = size < 180 ? 5 : 6;
    const r = (size - sw * 2) / 2;
    const circ = 2 * Math.PI * r;
    const dash = circ * (1 - Math.max(0, Math.min(1, progress)));
    const color = mode === 'shortBreak' || mode === 'longBreak' ? '#34d399'
        : mode === 'stopwatch' ? '#a855f7' : '#f97316';
    return (
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw} />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={sw} strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={dash}
                style={{ filter: isRunning ? `drop-shadow(0 0 8px ${color}55)` : 'none' }}
                transition={{ type: 'tween', ease: 'linear', duration: 0.9 }}
            />
        </svg>
    );
};

/* ─── Inline task type ─── */
type OrbitTask = { id: string; title: string; urgency: number; checklists?: { completed: boolean }[]; statusChangedAt: number };

const FocusTimer = () => {
    const [mode, setMode] = useState<TimerMode>('pomodoro');
    const [timeLeft, setTimeLeft] = useState(DURATIONS.pomodoro);
    const [totalDur, setTotalDur] = useState(DURATIONS.pomodoro);
    const [isRunning, setIsRunning] = useState(false);
    const [sound, setSound] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editInput, setEditInput] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [pomCount, setPomCount] = useState(0);
    const [isFull, setIsFull] = useState(false);
    const sessionRef = useRef<number | null>(null);

    const [sessions, setSessions] = useState<Session[]>(() => {
        try { return JSON.parse(localStorage.getItem('focus-sessions') || '[]'); } catch { return []; }
    });

    const saveSessions = (s: Session[]) => { setSessions(s); localStorage.setItem('focus-sessions', JSON.stringify(s)); };

    /* ── Today stats ── */
    const todayStart = useMemo(() => new Date().setHours(0, 0, 0, 0), []);
    const todaySessions = useMemo(() => sessions.filter(s =>
        s.startTime >= todayStart && (s.type === 'pomodoro' || s.type === 'custom' || s.type === 'stopwatch')
    ), [sessions, todayStart]);
    const todaySecs = todaySessions.reduce((a, c) => a + c.duration, 0);
    const focusHrs = Math.floor(todaySecs / 3600);
    const focusMins = Math.floor((todaySecs % 3600) / 60);

    /* ── Orbit tasks (for fullscreen) ── */
    const orbitTasks = useMemo<OrbitTask[]>(() => {
        try { return (JSON.parse(localStorage.getItem('kanban-tasks') || '[]') as OrbitTask[]).filter(t => (t as any).status === 'doing'); }
        catch { return []; }
    }, [isRunning]);

    /* ── Mount: restore state ── */
    useEffect(() => {
        const savedMode = localStorage.getItem('timer-mode') as TimerMode | null;
        const savedRun = localStorage.getItem('timer-running') === 'true';
        const endTime = localStorage.getItem('timer-end-time');
        const startTime = localStorage.getItem('timer-start-time');
        const savedCount = localStorage.getItem('pomodoro-count');
        if (savedCount) setPomCount(parseInt(savedCount));
        if (savedMode) setMode(savedMode);
        if (savedRun) {
            if (savedMode === 'stopwatch' && startTime) {
                const e = Math.floor((Date.now() - parseInt(startTime)) / 1000);
                setTimeLeft(e); setTotalDur(e || 1); setIsRunning(true);
                sessionRef.current = parseInt(startTime);
            } else if (endTime) {
                const rem = Math.round((parseInt(endTime) - Date.now()) / 1000);
                const dur = savedMode && DURATIONS[savedMode] ? DURATIONS[savedMode] : 25 * 60;
                setTotalDur(dur);
                if (rem > 0) { setTimeLeft(rem); setIsRunning(true); sessionRef.current = startTime ? parseInt(startTime) : Date.now() - (dur - rem) * 1000; }
                else setTimeLeft(0);
            }
        } else {
            const sl = localStorage.getItem('timer-time-left');
            const dur = savedMode && DURATIONS[savedMode] ? DURATIONS[savedMode] : 25 * 60;
            if (savedMode === 'stopwatch') setTimeLeft(sl ? parseInt(sl) : 0);
            else if (savedMode === 'custom' && sl) { setTimeLeft(parseInt(sl)); setTotalDur(parseInt(sl)); }
            else { setTimeLeft(dur); setTotalDur(dur); }
        }
    }, []); // eslint-disable-line

    /* ── ESC ── */
    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFull(false); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, []);

    /* ── Add session ── */
    const addSession = useCallback((m: TimerMode, start: number, dur: number, completed: boolean) => {
        const s: Session = { id: crypto.randomUUID(), type: m, startTime: start, duration: Math.max(dur, 0), completed };
        if (s.duration >= 30) setSessions(prev => { const u = [...prev, s]; localStorage.setItem('focus-sessions', JSON.stringify(u)); return u; });
    }, []);

    /* ── Complete ── */
    const handleComplete = useCallback(() => {
        setIsRunning(false);
        localStorage.setItem('timer-running', 'false');
        localStorage.removeItem('timer-end-time');
        if (sound) playChimeSound();
        if (sessionRef.current) addSession(mode, sessionRef.current, totalDur, true);
        if (mode === 'pomodoro') { const n = pomCount + 1; setPomCount(n); localStorage.setItem('pomodoro-count', n.toString()); }
        sessionRef.current = null;
    }, [mode, sound, addSession, totalDur, pomCount]);

    /* ── Tick ── */
    useEffect(() => {
        if (!isRunning) return;
        const iv = setInterval(() => {
            setTimeLeft(prev => {
                if (mode === 'stopwatch') { const n = prev + 1; localStorage.setItem('timer-time-left', n.toString()); return n; }
                const n = prev - 1;
                localStorage.setItem('timer-time-left', n.toString());
                if (n <= 0) { handleComplete(); return 0; }
                return n;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [isRunning, mode, handleComplete]);

    /* ── Toggle ── */
    const toggleTimer = () => {
        if (isRunning) {
            setIsRunning(false); localStorage.setItem('timer-running', 'false');
            if (mode === 'stopwatch' && sessionRef.current) { addSession('stopwatch', sessionRef.current, timeLeft, false); sessionRef.current = null; }
        } else {
            const start = Date.now(); sessionRef.current = start;
            if (mode === 'stopwatch') {
                const off = timeLeft > 0 ? Date.now() - timeLeft * 1000 : Date.now();
                localStorage.setItem('timer-start-time', off.toString());
            } else {
                const dur = timeLeft > 0 ? timeLeft : totalDur;
                localStorage.setItem('timer-duration-setting', dur.toString());
                localStorage.setItem('timer-start-time', start.toString());
                localStorage.setItem('timer-end-time', (start + dur * 1000).toString());
            }
            setIsRunning(true); localStorage.setItem('timer-running', 'true');
        }
    };

    /* ── Reset ── */
    const resetTimer = () => {
        setIsRunning(false);
        const dur = mode === 'stopwatch' ? 0 : (DURATIONS[mode] ?? totalDur);
        setTimeLeft(dur); sessionRef.current = null;
        localStorage.setItem('timer-running', 'false'); localStorage.setItem('timer-time-left', dur.toString());
        localStorage.removeItem('timer-end-time'); localStorage.removeItem('timer-duration-setting');
        localStorage.removeItem('timer-start-time');
    };

    /* ── Switch mode ── */
    const switchMode = (m: TimerMode) => {
        if (isRunning && !confirm('Timer is running. Switch mode?')) return;
        setMode(m); setIsRunning(false);
        localStorage.setItem('timer-mode', m); localStorage.setItem('timer-running', 'false');
        sessionRef.current = null;
        const dur = m === 'stopwatch' ? 0 : (DURATIONS[m] ?? 25 * 60);
        setTimeLeft(dur); setTotalDur(dur || 1);
        localStorage.setItem('timer-time-left', dur.toString());
        localStorage.removeItem('timer-end-time');
    };

    /* ── Adjust ── */
    const adjustTime = (deltaMins: number) => {
        if (isRunning) return;
        const nd = Math.max(60, timeLeft + deltaMins * 60);
        setTimeLeft(nd); setTotalDur(nd); setMode('custom');
        localStorage.setItem('timer-mode', 'custom'); localStorage.setItem('timer-time-left', nd.toString());
    };

    /* ── Edit submit ── */
    const handleEditSubmit = () => {
        const parts = editInput.split(':').map(p => parseInt(p.trim()));
        let secs = 0;
        if (parts.length === 2) secs = (parts[0] || 0) * 60 + (parts[1] || 0);
        else if (parts.length === 1 && !isNaN(parts[0])) secs = parts[0] * 60;
        if (secs > 0) { setTimeLeft(secs); setTotalDur(secs); setMode('custom'); localStorage.setItem('timer-mode', 'custom'); localStorage.setItem('timer-time-left', secs.toString()); }
        setIsEditing(false); setEditInput('');
    };

    /* ── Format ── */
    const fmt = (s: number) => {
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const display = fmt(timeLeft);
    const progress = mode === 'stopwatch' ? 0 : totalDur > 0 ? timeLeft / totalDur : 0;
    const today = new Date();
    const accentColor = mode === 'shortBreak' || mode === 'longBreak' ? 'text-emerald-400' : mode === 'stopwatch' ? 'text-purple-400' : 'text-orange-400';
    const accentBg = mode === 'shortBreak' || mode === 'longBreak' ? 'bg-emerald-500' : mode === 'stopwatch' ? 'bg-purple-500' : 'bg-orange-500';
    const glowColor = mode === 'shortBreak' || mode === 'longBreak' ? '52,211,153' : mode === 'stopwatch' ? '168,85,247' : '249,115,22';

    const modes = [
        { id: 'pomodoro' as TimerMode, label: 'Focus', icon: Target },
        { id: 'shortBreak' as TimerMode, label: 'Short', icon: Coffee },
        { id: 'longBreak' as TimerMode, label: 'Long', icon: Moon },
        { id: 'stopwatch' as TimerMode, label: 'Watch', icon: Timer },
    ];

    /* ── Fullscreen ── */
    if (isFull) return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[9990] bg-[#060606] flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar">
            <div className={cn("absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full blur-[100px] sm:blur-[130px] opacity-[0.07] pointer-events-none", `bg-[rgb(${glowColor})]`)} />

            {/* Timer side */}
            <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-12 lg:py-0 min-h-screen lg:min-h-0">
                <button onClick={() => setIsFull(false)} className="absolute top-5 right-5 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-700 hover:text-zinc-200 transition-all" title="Exit (Esc)">
                    <Minimize2 size={15} />
                </button>
                <p className="absolute top-6 left-5 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-800">Esc to exit</p>

                <div className="relative flex items-center justify-center w-[250px] h-[250px] sm:w-[300px] sm:h-[300px]">
                    <div className="hidden sm:block absolute inset-0">
                        <TimerRing progress={progress} isRunning={isRunning} mode={mode} size={300} />
                    </div>
                    <div className="sm:hidden absolute inset-0">
                        <TimerRing progress={progress} isRunning={isRunning} mode={mode} size={250} />
                    </div>
                    <div className="flex flex-col items-center z-10">
                        <span className={cn("font-black tabular-nums text-zinc-100", display.length > 5 ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl")}>{display}</span>
                        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] mt-2", accentColor)}>
                            {mode === 'pomodoro' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : mode === 'stopwatch' ? 'Stopwatch' : 'Custom'}
                        </span>
                        {mode === 'pomodoro' && (
                            <div className="flex gap-2 mt-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", i < (pomCount % 4) ? "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.7)]" : "bg-white/[0.07]")} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-8">
                    <button onClick={resetTimer} className="w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-all active:scale-90"><RotateCcw size={16} /></button>
                    <button onClick={toggleTimer} className={cn("w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all active:scale-95", isRunning ? "bg-white/[0.06] border border-white/10 text-zinc-200" : cn("text-white", accentBg))} style={!isRunning ? { boxShadow: `0 8px 28px rgba(${glowColor},0.35)` } : {}}>
                        {isRunning ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-0.5" />}
                    </button>
                    <button onClick={() => setSound(s => !s)} className="w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-all">
                        {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                </div>
            </div>

            {/* Active tasks side */}
            <div className="w-full lg:w-72 xl:w-88 border-t lg:border-t-0 lg:border-l border-white/[0.05] flex flex-col bg-[#080808]">
                <div className="px-5 pt-7 pb-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.7)]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">Active Tasks</p>
                        <span className="ml-auto text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md">{orbitTasks.length}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 flex flex-col gap-2">
                    {orbitTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <Target size={20} className="text-zinc-800 mb-2" />
                            <p className="text-[10px] font-bold text-zinc-700">No active tasks</p>
                            <p className="text-[9px] text-zinc-800 mt-1">Move tasks to Active on the Board</p>
                        </div>
                    ) : orbitTasks.map((t, idx) => {
                        const elapsed = Date.now() - t.statusChangedAt;
                        const elStr = Math.floor(elapsed / 3600000) > 0 ? `${Math.floor(elapsed / 3600000)}h` : `${Math.floor(elapsed / 60000)}m`;
                        const done = t.checklists?.filter(c => c.completed).length || 0;
                        const tot = t.checklists?.length || 0;
                        return (
                            <motion.div key={t.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 hover:border-orange-500/10 transition-colors">
                                <p className="text-sm font-bold text-zinc-200 leading-snug mb-2">{t.title}</p>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                                        t.urgency >= 5 ? "bg-red-500/15 text-red-400 border-red-500/20" :
                                            t.urgency >= 4 ? "bg-orange-500/15 text-orange-400 border-orange-500/20" :
                                                t.urgency >= 3 ? "bg-amber-500/10 text-amber-500 border-amber-500/15" :
                                                    "bg-zinc-800 text-zinc-600 border-zinc-700/50"
                                    )}>{t.urgency >= 5 ? 'Critical' : t.urgency >= 4 ? 'High' : t.urgency >= 3 ? 'Med' : 'Low'}</span>
                                    <span className="text-[8px] font-bold text-orange-400/80 ml-auto">⏱ {elStr} active</span>
                                </div>
                                {tot > 0 && (
                                    <div className="mt-2">
                                        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(done / tot) * 100}%` }} />
                                        </div>
                                        <p className="text-[8px] text-zinc-700 mt-0.5">{done}/{tot}</p>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
                {isRunning && (
                    <div className="px-4 py-3 border-t border-white/[0.04]">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/5 border border-orange-500/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <p className="text-[9px] font-bold text-orange-400/60">Stay focused</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );

    /* ════════════════════════════════════════════
       MAIN VIEW — Mobile-first single column,
       Desktop: two col (timer | stats)
    ════════════════════════════════════════════ */
    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
            <div className="min-h-full flex flex-col lg:flex-row">

                {/* ═══ LEFT / TOP: Timer ═══ */}
                <div className="flex-1 flex flex-col items-center px-4 pt-6 pb-8 lg:py-0 lg:justify-center relative">
                    {/* Ambient glow — smaller on mobile */}
                    <div className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] opacity-[0.08] pointer-events-none",
                        "w-64 h-64 lg:w-96 lg:h-96",
                        mode === 'shortBreak' || mode === 'longBreak' ? 'bg-emerald-500' : mode === 'stopwatch' ? 'bg-purple-500' : 'bg-orange-500'
                    )} />

                    <div className="relative z-10 w-full max-w-xs">

                        {/* ── Top row: date + actions ── */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700">
                                    {today.toLocaleString('default', { weekday: 'short' })},{' '}
                                    {today.toLocaleString('default', { month: 'short' })} {today.getDate()}
                                </p>
                                {isRunning && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                        <p className="text-[9px] font-bold text-orange-400">Running</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setSound(s => !s)} className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-600 hover:text-zinc-300 transition-all">
                                    {sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                </button>
                                <button onClick={() => setIsFull(true)} className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-600 hover:text-orange-400 hover:border-orange-500/20 transition-all" title="Fullscreen">
                                    <Maximize2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* ── Mode tabs ── */}
                        <div className="flex gap-0.5 bg-white/[0.03] border border-white/[0.06] p-1 rounded-2xl mb-5 w-full">
                            {modes.map(m => (
                                <button key={m.id} onClick={() => switchMode(m.id)}
                                    className={cn(
                                        "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[8px] font-black uppercase tracking-wide transition-all",
                                        mode === m.id ? cn("text-white border border-white/10 bg-white/[0.04]") : "text-zinc-700 hover:text-zinc-500"
                                    )}
                                >
                                    <m.icon size={11} className={mode === m.id ? accentColor : ''} />
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* ── Ring — responsive size ── */}
                        <div className="flex justify-center mb-4">
                            {/* On mobile: 220px ring, on sm+: 256px */}
                            <div className="relative flex items-center justify-center w-[220px] h-[220px] sm:w-[256px] sm:h-[256px]">
                                <div className="hidden sm:block absolute inset-0">
                                    <TimerRing progress={progress} isRunning={isRunning} mode={mode} size={256} />
                                </div>
                                <div className="sm:hidden absolute inset-0">
                                    <TimerRing progress={progress} isRunning={isRunning} mode={mode} size={220} />
                                </div>

                                <div className="flex flex-col items-center z-10">
                                    {isEditing ? (
                                        <input autoFocus type="text" value={editInput}
                                            onChange={e => setEditInput(e.target.value)}
                                            onBlur={handleEditSubmit}
                                            onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') setIsEditing(false); }}
                                            placeholder="25:00"
                                            className="w-28 text-3xl font-black bg-transparent text-center outline-none text-zinc-200 border-b-2 border-orange-500/60 pb-1"
                                        />
                                    ) : (
                                        <motion.span
                                            key={display}
                                            initial={{ opacity: 0.7, scale: 0.96 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={cn("font-black tabular-nums text-zinc-100 leading-none", display.length > 5 ? "text-4xl" : "text-5xl")}
                                            onClick={() => { if (!isRunning && mode !== 'stopwatch') { setIsEditing(true); setEditInput(fmt(timeLeft)); } }}
                                        >
                                            {display}
                                        </motion.span>
                                    )}
                                    <span className={cn("text-[9px] font-black uppercase tracking-[0.18em] mt-2", accentColor)}>
                                        {mode === 'pomodoro' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : mode === 'stopwatch' ? 'Stopwatch' : 'Custom'}
                                    </span>
                                    {mode === 'pomodoro' && (
                                        <div className="flex gap-1.5 mt-2.5">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i < (pomCount % 4) ? "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.6)]" : "bg-white/[0.08]")} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Adjust buttons ── */}
                        {mode !== 'stopwatch' && !isRunning && (
                            <div className="flex items-center justify-center gap-2 mb-4">
                                {[-5, -1, 1, 5].map(d => (
                                    <button key={d} onClick={() => adjustTime(d)}
                                        className={cn("text-[9px] font-black px-2.5 py-1.5 rounded-xl border transition-all",
                                            d > 0 ? "border-white/[0.08] text-zinc-500 hover:text-zinc-200 hover:border-white/20"
                                                : "border-white/[0.05] text-zinc-700 hover:text-zinc-500 hover:border-white/10"
                                        )}>
                                        {d > 0 ? '+' : ''}{d}m
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── Controls ── */}
                        <div className="flex items-center justify-center gap-4 mb-5">
                            <button onClick={resetTimer} className="w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:border-white/20 transition-all active:scale-90">
                                <RotateCcw size={16} />
                            </button>
                            <button onClick={toggleTimer}
                                className={cn("w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl",
                                    isRunning ? "bg-white/[0.07] border border-white/[0.12] text-zinc-200 hover:bg-white/10" : cn("text-white", accentBg, "hover:opacity-90")
                                )}
                                style={!isRunning ? { boxShadow: `0 8px 28px rgba(${glowColor},0.3)` } : {}}
                            >
                                {isRunning ? <Pause size={21} className="fill-current" /> : <Play size={21} className="fill-current ml-0.5" />}
                            </button>
                            <button onClick={() => adjustTime(mode !== 'stopwatch' ? 5 : 0)} className="w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:border-white/20 transition-all active:scale-90" title="+5m">
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* ── Quick presets — horizontal scroll on mobile ── */}
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {[15, 25, 45, 60, 90].map(p => (
                                <button key={p} onClick={() => {
                                    if (isRunning && !confirm('Reset timer?')) return;
                                    const s = p * 60; setMode('custom'); setTimeLeft(s); setTotalDur(s); setIsRunning(false);
                                    localStorage.setItem('timer-mode', 'custom'); localStorage.setItem('timer-time-left', s.toString());
                                    sessionRef.current = null;
                                }} className="flex-shrink-0 px-3 py-1.5 text-[9px] font-black uppercase rounded-xl bg-white/[0.03] text-zinc-600 border border-white/[0.05] hover:bg-white/[0.06] hover:text-zinc-300 hover:border-white/10 transition-all">
                                    {p}m
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ RIGHT / BOTTOM: Stats ═══ */}
                <div className="w-full lg:w-76 xl:w-88 border-t lg:border-t-0 lg:border-l border-white/[0.05] bg-[#0d0d0d] flex flex-col">

                    {/* Today stats */}
                    <div className="p-4 border-b border-white/[0.05]">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-700">Today's Focus</p>
                            <div className="flex items-center gap-1.5">
                                <Flame size={11} className={isRunning && mode === 'pomodoro' ? "text-orange-500 animate-pulse" : "text-zinc-700"} />
                                <span className="text-[11px] font-black text-zinc-400">{focusHrs > 0 && `${focusHrs}h `}{focusMins}m</span>
                            </div>
                        </div>

                        {/* Goal bar */}
                        <div className="mb-3">
                            <div className="flex justify-between text-[8px] text-zinc-700 mb-1 font-bold uppercase tracking-widest">
                                <span>4h goal</span>
                                <span>{Math.min(100, Math.round(todaySecs / (4 * 3600) * 100))}%</span>
                            </div>
                            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                <motion.div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                                    animate={{ width: `${Math.min(100, (todaySecs / (4 * 3600)) * 100)}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }} />
                            </div>
                        </div>

                        {/* 3 stat chips */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Pomdoros', value: pomCount % 4 || (pomCount > 0 ? 4 : 0), sub: `${Math.floor(pomCount / 4)} sets`, color: 'text-orange-400' },
                                { label: 'Sessions', value: todaySessions.length, sub: 'today', color: 'text-zinc-300' },
                                { label: 'Hrs', value: `${Math.max(0, Math.floor(todaySecs / 3600))}`, sub: 'focused', color: 'text-purple-400' },
                            ].map(s => (
                                <div key={s.label} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-2 text-center">
                                    <p className={cn("text-base font-black", s.color)}>{s.value}</p>
                                    <p className="text-[8px] text-zinc-700 uppercase tracking-widest">{s.label}</p>
                                    <p className="text-[8px] text-zinc-800 mt-0.5">{s.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Session timeline */}
                    {todaySessions.length > 0 && (
                        <div className="px-4 py-3 border-b border-white/[0.05]">
                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-700 mb-2">Timeline</p>
                            <div className="flex h-2.5 w-full rounded-full bg-white/[0.04] overflow-hidden gap-px">
                                {todaySessions.slice(-12).map(s => (
                                    <div key={s.id} title={`${s.type} · ${Math.round(s.duration / 60)}m`}
                                        className={cn("h-full transition-all",
                                            s.type === 'stopwatch' ? "bg-purple-500/60" :
                                                s.type === 'shortBreak' || s.type === 'longBreak' ? "bg-emerald-500/60" :
                                                    s.completed ? "bg-orange-500" : "bg-orange-500/40"
                                        )}
                                        style={{ flexGrow: Math.max(s.duration / 60, 1) }}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between text-[7px] text-zinc-800 mt-1 font-mono">
                                <span>Start</span><span>Now</span>
                            </div>
                        </div>
                    )}

                    {/* History (collapsible) */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <button onClick={() => setShowHistory(h => !h)}
                            className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors w-full">
                            <div className="flex items-center gap-2">
                                <BarChart2 size={12} className="text-zinc-600" />
                                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600">History</span>
                                {sessions.length > 0 && (
                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-700 font-bold">{sessions.length}</span>
                                )}
                            </div>
                            <ChevronDown size={13} className={cn("text-zinc-700 transition-transform duration-200", showHistory && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                            {showHistory && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="overflow-y-auto custom-scrollbar max-h-56 px-3 py-2 flex flex-col gap-1">
                                        {sessions.length === 0 && <p className="text-[9px] text-zinc-800 text-center py-5">No sessions yet.</p>}
                                        {[...sessions].reverse().map(s => {
                                            const d = Math.round(s.duration / 60);
                                            const t = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const tod = s.startTime >= todayStart;
                                            return (
                                                <div key={s.id} className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors">
                                                    <div className={cn("w-1 h-6 rounded-full flex-shrink-0",
                                                        s.type === 'stopwatch' ? "bg-purple-500/60" :
                                                            s.type === 'shortBreak' || s.type === 'longBreak' ? "bg-emerald-500/60" :
                                                                s.completed ? "bg-orange-500" : "bg-orange-500/30"
                                                    )} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-bold text-zinc-400 capitalize">{s.type}</p>
                                                        <p className="text-[8px] text-zinc-700">{t}{tod ? ' · today' : ''}</p>
                                                    </div>
                                                    <p className="text-[10px] font-black text-zinc-400 flex-shrink-0">{d}m</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {sessions.length > 0 && (
                                        <div className="px-4 pb-3">
                                            <button onClick={() => { if (confirm('Clear all history?')) saveSessions([]); }}
                                                className="flex items-center gap-1.5 text-[8px] font-bold text-zinc-800 hover:text-red-400 uppercase tracking-widest transition-colors">
                                                <Trash2 size={9} />Clear history
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Quick presets — only desktop (mobile has them under the ring) */}
                    <div className="hidden lg:block px-4 py-3 border-t border-white/[0.05]">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-800 mb-2">Quick Presets</p>
                        <div className="flex flex-wrap gap-1.5">
                            {[15, 25, 45, 60, 90].map(p => (
                                <button key={p} onClick={() => {
                                    if (isRunning && !confirm('Reset timer?')) return;
                                    const s = p * 60; setMode('custom'); setTimeLeft(s); setTotalDur(s); setIsRunning(false);
                                    localStorage.setItem('timer-mode', 'custom'); localStorage.setItem('timer-time-left', s.toString());
                                    sessionRef.current = null;
                                }} className="px-2.5 py-1.5 text-[8px] font-black uppercase rounded-xl bg-white/[0.03] text-zinc-600 border border-white/[0.05] hover:bg-white/[0.06] hover:text-zinc-300 transition-all">
                                    {p}m
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
