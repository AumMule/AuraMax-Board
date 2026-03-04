import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, CheckSquare, Clock, TrendingUp, Zap, Coffee, BarChart2, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Task } from '../type/task';

type Session = {
    id: string;
    type: string;
    startTime: number;
    duration: number;
    completed: boolean;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_GOAL = 4 * 3600; // 4 hours daily

function getLast7Days(): { label: string; date: Date; ts: number }[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return { label: DAY_LABELS[d.getDay()], date: d, ts: d.getTime() };
    });
}

const StatCard = ({ icon: Icon, label, value, sub, color }: {
    icon: typeof Flame; label: string; value: string; sub?: string; color: string;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111111] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3"
    >
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", color + '/15')}>
            <Icon size={16} className={color} />
        </div>
        <div>
            <p className="text-2xl font-black text-zinc-100 leading-none">{value}</p>
            {sub && <p className="text-[10px] text-zinc-700 mt-1 font-medium">{sub}</p>}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-600">{label}</p>
    </motion.div>
);

const Analytics = () => {
    const sessions: Session[] = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('focus-sessions') || '[]'); } catch { return []; }
    }, []);

    const tasks: Task[] = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('kanban-tasks') || '[]'); } catch { return []; }
    }, []);

    const days = getLast7Days();
    const todayStart = days[6].ts;

    /* ── Per-day focus seconds ── */
    const dailyFocus = useMemo(() => days.map(({ ts }) => {
        const next = ts + 86400000;
        return sessions
            .filter(s => s.startTime >= ts && s.startTime < next && (s.type === 'pomodoro' || s.type === 'custom' || s.type === 'stopwatch'))
            .reduce((a, c) => a + c.duration, 0);
    }), [sessions, days]);

    const maxDaily = Math.max(...dailyFocus, 1);
    const todayFocus = dailyFocus[6];
    const weekTotal = dailyFocus.reduce((a, b) => a + b, 0);

    /* ── Session type breakdown (today) ── */
    const todaySessions = sessions.filter(s => s.startTime >= todayStart);
    const pomodoroCount = sessions.filter(s => s.type === 'pomodoro' && s.completed).length;
    const breakCount = sessions.filter(s => (s.type === 'shortBreak' || s.type === 'longBreak') && s.completed).length;

    /* ── Tasks analytics ── */
    const done = tasks.filter(t => t.status === 'done').length;
    const doing = tasks.filter(t => t.status === 'doing').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    /* ── Average focus per session ── */
    const focusSessions = sessions.filter(s => s.type === 'pomodoro' || s.type === 'custom');
    const avgSession = focusSessions.length > 0
        ? Math.round(focusSessions.reduce((a, c) => a + c.duration, 0) / focusSessions.length / 60)
        : 0;

    /* ── Urgency distribution ── */
    const urgencyBuckets = [5, 4, 3, 1].map(u => ({
        label: u === 5 ? 'Critical' : u === 4 ? 'High' : u === 3 ? 'Medium' : 'Low',
        count: tasks.filter(t => t.urgency === u || (u === 1 && t.urgency < 3)).length,
        color: u === 5 ? 'bg-red-500' : u === 4 ? 'bg-orange-500' : u === 3 ? 'bg-amber-500' : 'bg-zinc-600',
        text: u === 5 ? 'text-red-400' : u === 4 ? 'text-orange-400' : u === 3 ? 'text-amber-500' : 'text-zinc-500',
    }));

    /* ── Streak ── */
    let streak = 0;
    for (let i = 6; i >= 0; i--) {
        if (dailyFocus[i] >= 1800) streak++; else break;
    }

    const fmtTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-[#0a0a0a] p-5 md:p-8">
            <div className="max-w-5xl mx-auto flex flex-col gap-6">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <BarChart2 size={15} className="text-orange-400" />
                        </div>
                        <h1 className="text-xl font-black text-zinc-100 tracking-tight">Analytics</h1>
                    </div>
                    <p className="text-[12px] text-zinc-600 ml-11">Your focus & productivity overview</p>
                </motion.div>

                {/* ── Stat cards row ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                        { icon: Flame, label: 'Today Focus', value: fmtTime(todayFocus), sub: `Goal: ${fmtTime(HOUR_GOAL)}`, color: 'text-orange-400' },
                        { icon: Calendar, label: 'Week Total', value: fmtTime(weekTotal), sub: `${days.filter((_, i) => dailyFocus[i] > 0).length} active days`, color: 'text-purple-400' },
                        { icon: Target, label: 'Pomodoros', value: String(pomodoroCount), sub: `${breakCount} breaks`, color: 'text-orange-400' },
                        { icon: TrendingUp, label: 'Avg Session', value: `${avgSession}m`, sub: `${focusSessions.length} total`, color: 'text-emerald-400' },
                        { icon: Zap, label: 'Day Streak', value: `${streak}d`, sub: streak > 0 ? '≥30m/day' : 'Start today!', color: 'text-amber-400' },
                    ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <StatCard {...s} />
                        </motion.div>
                    ))}
                </div>

                {/* ── 7-day bar chart ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="bg-[#111111] border border-white/[0.06] rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">7-Day Focus</p>
                            <p className="text-sm font-bold text-zinc-300 mt-0.5">{fmtTime(weekTotal)} this week</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-wider">Daily Goal</p>
                            <p className="text-sm font-black text-orange-400">4h</p>
                        </div>
                    </div>

                    <div className="flex items-end gap-2 h-40">
                        {days.map(({ label, ts }, i) => {
                            const secs = dailyFocus[i];
                            const pct = Math.min(100, (secs / maxDaily) * 100);
                            const isToday = ts === todayStart;
                            const metGoal = secs >= HOUR_GOAL;
                            return (
                                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full flex-1 flex items-end">
                                        <div className="relative w-full group">
                                            {/* Tooltip */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-white/10 px-2 py-1 rounded-lg text-[9px] font-bold text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                {secs > 0 ? fmtTime(secs) : '–'}
                                            </div>
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max(pct, secs > 0 ? 4 : 1)}%` }}
                                                transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                                                className={cn(
                                                    "w-full rounded-t-lg transition-all",
                                                    secs === 0 ? "bg-white/[0.04]" :
                                                        metGoal ? "bg-gradient-to-t from-orange-600 to-orange-400" :
                                                            isToday ? "bg-orange-500/60" : "bg-orange-500/30"
                                                )}
                                                style={{ minHeight: '4px' }}
                                            />
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-wider",
                                        isToday ? "text-orange-400" : "text-zinc-700"
                                    )}>
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Goal line */}
                    <div className="flex items-center gap-2 mt-4">
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-orange-500/40 to-transparent rounded-full" />
                        <span className="text-[8px] font-bold text-orange-500/50 uppercase tracking-widest">4h target</span>
                    </div>
                </motion.div>

                {/* ── Two column: session breakdown + task overview ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Session Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-[#111111] border border-white/[0.06] rounded-2xl p-5"
                    >
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4">Today's Sessions</p>

                        {todaySessions.length === 0 ? (
                            <div className="flex flex-col items-center py-8 text-zinc-800">
                                <Clock size={28} className="mb-2 opacity-40" />
                                <p className="text-[11px] font-bold">No sessions yet today</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {todaySessions.map(s => {
                                    const mins = Math.round(s.duration / 60);
                                    const time = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                            <div className={cn("w-1 h-8 rounded-full flex-shrink-0",
                                                s.type === 'stopwatch' ? 'bg-purple-500' :
                                                    s.type === 'shortBreak' || s.type === 'longBreak' ? 'bg-emerald-500' :
                                                        s.completed ? 'bg-orange-500' : 'bg-orange-500/40'
                                            )} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold text-zinc-400 capitalize">{s.type}</p>
                                                <p className="text-[9px] text-zinc-700">{time}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] font-black text-zinc-300">{mins}m</p>
                                                {s.completed && <p className="text-[8px] text-emerald-500/70 font-bold">✓</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* Task Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        className="bg-[#111111] border border-white/[0.06] rounded-2xl p-5"
                    >
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4">Task Overview</p>

                        {total === 0 ? (
                            <div className="flex flex-col items-center py-8 text-zinc-800">
                                <CheckSquare size={28} className="mb-2 opacity-40" />
                                <p className="text-[11px] font-bold">No tasks yet</p>
                            </div>
                        ) : (
                            <>
                                {/* Completion gauge */}
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="relative w-20 h-20 flex-shrink-0">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                                            <motion.circle
                                                cx="40" cy="40" r="32" fill="none"
                                                stroke="#f97316" strokeWidth="7" strokeLinecap="round"
                                                strokeDasharray={2 * Math.PI * 32}
                                                initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                                                animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - completionRate / 100) }}
                                                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-black text-zinc-200">{completionRate}%</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 flex-1">
                                        {[
                                            { label: 'Done', count: done, color: 'bg-emerald-500' },
                                            { label: 'In Orbit', count: doing, color: 'bg-orange-500' },
                                            { label: 'Backlog', count: todo, color: 'bg-zinc-600' },
                                        ].map(s => (
                                            <div key={s.label} className="flex items-center gap-2">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", s.color)} />
                                                <span className="text-[10px] text-zinc-500 flex-1">{s.label}</span>
                                                <span className="text-[10px] font-black text-zinc-400">{s.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Completion bar */}
                                <div>
                                    <div className="flex justify-between text-[9px] text-zinc-700 mb-1.5 font-bold uppercase tracking-widest">
                                        <span>Completion</span>
                                        <span>{done}/{total} tasks</span>
                                    </div>
                                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${completionRate}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>

                {/* ── Urgency Distribution ── */}
                {total > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-[#111111] border border-white/[0.06] rounded-2xl p-5"
                    >
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4">Task Urgency Distribution</p>
                        <div className="flex flex-col gap-3">
                            {urgencyBuckets.map(b => (
                                <div key={b.label} className="flex items-center gap-3">
                                    <span className={cn("text-[10px] font-black uppercase w-16 flex-shrink-0", b.text)}>{b.label}</span>
                                    <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${total > 0 ? (b.count / total) * 100 : 0}%` }}
                                            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.35 }}
                                            className={cn("h-full rounded-full", b.color)}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-600 w-6 text-right">{b.count}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Focus streaks heatmap mini (last 7) ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="bg-[#111111] border border-white/[0.06] rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Daily Activity</p>
                        <div className="flex items-center gap-2">
                            <Coffee size={11} className="text-zinc-700" />
                            <span className="text-[9px] text-zinc-700">Orange = focus reached goal</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {days.map(({ label, ts }, i) => {
                            const secs = dailyFocus[i];
                            const isToday = ts === todayStart;
                            const intensity = secs === 0 ? 0 : secs < 1800 ? 1 : secs < HOUR_GOAL ? 2 : 3;
                            return (
                                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                                    <div className={cn(
                                        "w-full aspect-square rounded-xl border transition-all",
                                        intensity === 0 ? "bg-white/[0.03] border-white/[0.04]" :
                                            intensity === 1 ? "bg-orange-500/10 border-orange-500/10" :
                                                intensity === 2 ? "bg-orange-500/25 border-orange-500/20" :
                                                    "bg-orange-500/50 border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.2)]",
                                        isToday && "ring-1 ring-orange-500/40"
                                    )} title={secs > 0 ? fmtTime(secs) : 'No data'} />
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-wider",
                                        isToday ? "text-orange-400" : "text-zinc-800"
                                    )}>{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default Analytics;
