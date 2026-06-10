import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, X, Target,
  CheckCircle2, Circle, Flame, Trash2, Edit3, Check, Flag,
  Upload, Copy, CheckCheck, Sparkles
} from 'lucide-react';
import type { Task } from '../type/task';

type GoalStatus = 'active' | 'done' | 'overdue';

interface Goal {
  id: string;
  title: string;
  description?: string;
  dateKey: string; // 'YYYY-MM-DD'
  color: string;
  status: GoalStatus;
  createdAt: number;
  milestones: { id: string; text: string; done: boolean }[];
}

const COLORS = [
  '#f97316', '#a855f7', '#06b6d4', '#10b981', '#f43f5e', '#eab308', '#3b82f6'
];

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const loadGoals = (): Goal[] => {
  try { return JSON.parse(localStorage.getItem('nexus-goals') || '[]'); } catch { return []; }
};
const saveGoals = (g: Goal[]) => localStorage.setItem('nexus-goals', JSON.stringify(g));

const COLOR_MAP: Record<string, string> = {
  orange: '#f97316', purple: '#a855f7', cyan: '#06b6d4',
  green: '#10b981', red: '#f43f5e', yellow: '#eab308', blue: '#3b82f6'
};

const CHATGPT_PROMPT = `Format my study plan using EXACTLY this structure for the Goals Calendar app:

📅 YYYY-MM-DD
GOAL: [goal title]
COLOR: [orange|purple|cyan|green|red|yellow|blue]
DESCRIPTION: [brief one-line description]
- [milestone 1]
- [milestone 2]
- [milestone 3]

📅 YYYY-MM-DD
GOAL: [another goal, same or different date]
COLOR: [color]
- [milestone]

Rules:
• Use ISO date format YYYY-MM-DD (e.g. 2026-06-10)
• Each date block can have multiple GOALs
• COLOR must be exactly one of: orange, purple, cyan, green, red, yellow, blue
• Each milestone line starts with "- "
• DESCRIPTION line is optional
• Do not add any extra text outside this format

Here is my study plan:
[PASTE YOUR PLAN HERE]`;

const loadTasks = (): Task[] => {
  try { return JSON.parse(localStorage.getItem('kanban-tasks') || '[]'); } catch { return []; }
};

export default function GoalsCalendar() {
  const today = new Date();
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<{ added: number; error?: string } | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [goals, setGoals] = useState<Goal[]>(loadGoals);
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [selectedKey, setSelectedKey] = useState<string | null>(toKey(today));
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState({ title: '', description: '', color: COLORS[0], milestone: '' });
  const [milestones, setMilestones] = useState<{ id: string; text: string; done: boolean }[]>([]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(CHATGPT_PROMPT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const parseAndImport = () => {
    setImportResult(null);
    const text = importText.trim();
    if (!text) return;

    const newGoals: Goal[] = [];
    // Split by date headers
    const dateBlocks = text.split(/(?=📅)/).filter(b => b.trim());

    for (const block of dateBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) continue;

      // Parse date from first line: 📅 2026-06-10
      const dateLine = lines[0].replace('📅', '').trim();
      const dateMatch = dateLine.match(/(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) continue;
      const dateKey = dateMatch[1];

      // Split remaining lines into GOAL blocks
      const rest = lines.slice(1);
      let current: { title: string; color: string; desc: string; milestones: string[] } | null = null;

      for (const line of rest) {
        if (line.startsWith('GOAL:')) {
          if (current) {
            newGoals.push({
              id: crypto.randomUUID(),
              title: current.title,
              description: current.desc || undefined,
              dateKey,
              color: current.color,
              status: 'active',
              createdAt: Date.now(),
              milestones: current.milestones.map(m => ({ id: crypto.randomUUID(), text: m, done: false }))
            });
          }
          current = { title: line.replace('GOAL:', '').trim(), color: '#f97316', desc: '', milestones: [] };
        } else if (line.startsWith('COLOR:') && current) {
          const c = line.replace('COLOR:', '').trim().toLowerCase();
          current.color = COLOR_MAP[c] || '#f97316';
        } else if (line.startsWith('DESCRIPTION:') && current) {
          current.desc = line.replace('DESCRIPTION:', '').trim();
        } else if (line.startsWith('- ') && current) {
          current.milestones.push(line.replace(/^- /, '').trim());
        }
      }
      if (current) {
        newGoals.push({
          id: crypto.randomUUID(),
          title: current.title,
          description: current.desc || undefined,
          dateKey,
          color: current.color,
          status: 'active',
          createdAt: Date.now(),
          milestones: current.milestones.map(m => ({ id: crypto.randomUUID(), text: m, done: false }))
        });
      }
    }

    if (!newGoals.length) {
      setImportResult({ added: 0, error: 'Could not parse any goals. Check the format.' });
      return;
    }
    setGoals(prev => [...prev, ...newGoals]);
    setImportResult({ added: newGoals.length });
    setImportText('');
    setTimeout(() => { setShowImport(false); setImportResult(null); }, 1800);
  };

  useEffect(() => { saveGoals(goals); }, [goals]);
  useEffect(() => {
    const onStorage = () => setTasks(loadTasks());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const goalsForKey = (key: string) => goals.filter(g => g.dateKey === key);
  const tasksForKey = (key: string) => tasks.filter(t => {
    if (!t.dueDate) return false;
    return toKey(new Date(t.dueDate)) === key;
  });

  const openNew = (key: string) => {
    setSelectedKey(key);
    setEditGoal(null);
    setForm({ title: '', description: '', color: COLORS[0], milestone: '' });
    setMilestones([]);
    setShowForm(true);
  };

  const openEdit = (g: Goal) => {
    setEditGoal(g);
    setForm({ title: g.title, description: g.description || '', color: g.color, milestone: '' });
    setMilestones([...g.milestones]);
    setShowForm(true);
  };

  const saveGoal = () => {
    if (!form.title.trim() || !selectedKey) return;
    if (editGoal) {
      setGoals(prev => prev.map(g => g.id === editGoal.id
        ? { ...g, title: form.title, description: form.description, color: form.color, milestones }
        : g
      ));
    } else {
      const ng: Goal = {
        id: crypto.randomUUID(),
        title: form.title,
        description: form.description,
        dateKey: selectedKey,
        color: form.color,
        status: 'active',
        createdAt: Date.now(),
        milestones
      };
      setGoals(prev => [...prev, ng]);
    }
    setShowForm(false);
  };

  const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

  const toggleGoalDone = (id: string) => setGoals(prev => prev.map(g =>
    g.id === id ? { ...g, status: g.status === 'done' ? 'active' : 'done' } : g
  ));

  const toggleMilestone = (goalId: string, mId: string) => setGoals(prev => prev.map(g =>
    g.id === goalId
      ? { ...g, milestones: g.milestones.map(m => m.id === mId ? { ...m, done: !m.done } : m) }
      : g
  ));

  const addMilestone = () => {
    if (!form.milestone.trim()) return;
    setMilestones(prev => [...prev, { id: crypto.randomUUID(), text: form.milestone.trim(), done: false }]);
    setForm(f => ({ ...f, milestone: '' }));
  };

  const selectedGoals = selectedKey ? goalsForKey(selectedKey) : [];
  const selectedTasks = selectedKey ? tasksForKey(selectedKey) : [];

  const allGoals = [...goals].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const activeGoals = allGoals.filter(g => g.status !== 'done');
  const doneGoals = allGoals.filter(g => g.status === 'done');

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar relative">
      <div className="mesh-bg absolute inset-0 -z-10" />

      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/20 rounded-xl">
            <Target className="text-purple-400" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#e4e4e7] tracking-tight">Goals & Calendar</h1>
            <p className="text-xs font-bold text-[#52525b] uppercase tracking-widest">Plan your milestones on the calendar</p>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-zinc-500 font-semibold">
            <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              {activeGoals.length} active
            </span>
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg">
              {doneGoals.length} done
            </span>
            <button
              onClick={() => { setShowImport(true); setImportResult(null); }}
              className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-lg transition-all"
            >
              <Upload size={11} /> Import Plan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-[#18181b]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/20">
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-base font-black text-white tracking-tight">
                {MONTHS[month]} <span className="text-orange-400">{year}</span>
              </h2>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest py-1">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = toKey(today) === key;
                const isSelected = selectedKey === key;
                const dayGoals = goalsForKey(key);
                const dayTasks = tasksForKey(key);
                const hasItems = dayGoals.length > 0 || dayTasks.length > 0;

                return (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedKey(isSelected ? null : key)}
                    className={`relative flex flex-col items-center rounded-xl py-1.5 px-1 min-h-[52px] transition-all border ${
                      isSelected
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                        : isToday
                        ? 'bg-white/5 border-white/20 text-white'
                        : 'border-transparent hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${isToday && !isSelected ? 'text-orange-400' : ''}`}>{day}</span>
                    {hasItems && (
                      <div className="flex flex-wrap justify-center gap-[2px] mt-1 max-w-full">
                        {dayGoals.slice(0, 3).map(g => (
                          <div key={g.id} style={{ background: g.color }} className="w-1.5 h-1.5 rounded-full opacity-80" />
                        ))}
                        {dayTasks.slice(0, 2).map(t => (
                          <div key={t.id} className="w-1.5 h-1.5 rounded-full bg-zinc-500 opacity-60" />
                        ))}
                      </div>
                    )}
                    {isSelected && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openNew(key); }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Plus size={10} className="text-white" />
                      </button>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-[10px] text-zinc-600 font-semibold">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Goal</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" /> Task due</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-orange-400 inline-block" /> Today</span>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Selected Day Panel */}
            <AnimatePresence mode="wait">
              {selectedKey && (
                <motion.div
                  key={selectedKey}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-[#18181b]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl shadow-black/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Selected</p>
                      <p className="text-sm font-bold text-white">
                        {new Date(selectedKey + 'T12:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => openNew(selectedKey)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105"
                    >
                      <Plus size={12} /> Add Goal
                    </button>
                  </div>

                  {selectedGoals.length === 0 && selectedTasks.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-4">Nothing planned. Add a goal!</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedGoals.map(g => (
                        <div key={g.id} style={{ borderLeftColor: g.color }} className="border-l-2 bg-white/[0.03] rounded-xl p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <button onClick={() => toggleGoalDone(g.id)} className="mt-0.5 flex-shrink-0">
                              {g.status === 'done'
                                ? <CheckCircle2 size={14} className="text-emerald-400" />
                                : <Circle size={14} className="text-zinc-500" />
                              }
                            </button>
                            <span className={`text-sm font-semibold flex-1 ${g.status === 'done' ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
                              {g.title}
                            </span>
                            <button onClick={() => openEdit(g)} className="text-zinc-600 hover:text-zinc-300 transition-colors"><Edit3 size={12} /></button>
                            <button onClick={() => deleteGoal(g.id)} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                          </div>
                          {g.description && <p className="text-[11px] text-zinc-500 ml-5">{g.description}</p>}
                          {g.milestones.length > 0 && (
                            <div className="ml-5 space-y-1">
                              {g.milestones.map(m => (
                                <button key={m.id} onClick={() => toggleMilestone(g.id, m.id)} className="flex items-center gap-1.5 w-full text-left">
                                  <div className={`w-3 h-3 rounded flex-shrink-0 border flex items-center justify-center transition-all ${m.done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'}`}>
                                    {m.done && <Check size={8} className="text-white" />}
                                  </div>
                                  <span className={`text-[11px] ${m.done ? 'line-through text-zinc-600' : 'text-zinc-400'}`}>{m.text}</span>
                                </button>
                              ))}
                              <div className="h-1 bg-white/5 rounded-full mt-2">
                                <div
                                  className="h-1 rounded-full transition-all"
                                  style={{ width: `${g.milestones.length ? (g.milestones.filter(m => m.done).length / g.milestones.length) * 100 : 0}%`, background: g.color }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {selectedTasks.map(t => (
                        <div key={t.id} className="border-l-2 border-zinc-700 bg-white/[0.02] rounded-xl p-3 flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'done' ? 'bg-emerald-500' : t.status === 'doing' ? 'bg-orange-500' : 'bg-zinc-600'}`} />
                          <span className={`text-xs font-medium flex-1 ${t.status === 'done' ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>{t.title}</span>
                          <span className="text-[10px] text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">{t.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upcoming Goals */}
            <div className="bg-[#18181b]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl shadow-black/20">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={14} className="text-orange-500" />
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Upcoming Goals</p>
              </div>
              {activeGoals.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-3">No active goals yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {activeGoals.slice(0, 8).map(g => (
                    <button
                      key={g.id}
                      onClick={() => { setSelectedKey(g.dateKey); setViewDate(new Date(g.dateKey + 'T12:00:00')); }}
                      className="w-full flex items-center gap-2.5 p-2.5 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-all text-left"
                    >
                      <div style={{ background: g.color }} className="w-2 h-2 rounded-full flex-shrink-0" />
                      <span className="text-xs font-semibold text-zinc-300 flex-1 truncate">{g.title}</span>
                      <span className="text-[10px] text-zinc-600 flex-shrink-0">
                        {new Date(g.dateKey + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Import Plan Modal */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowImport(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#111113] border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  <h3 className="text-sm font-black text-white">Import Study Plan</h3>
                </div>
                <button onClick={() => setShowImport(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Step 1 */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-black flex items-center justify-center">1</span>
                  <p className="text-xs font-bold text-zinc-400">Copy this prompt and paste into ChatGPT with your plan</p>
                </div>
                <div className="relative">
                  <pre className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-[11px] text-zinc-500 font-mono whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto custom-scrollbar">{CHATGPT_PROMPT}</pre>
                  <button
                    onClick={copyPrompt}
                    className={`absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      copiedPrompt ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {copiedPrompt ? <><CheckCheck size={11} /> Copied!</> : <><Copy size={11} /> Copy Prompt</>}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-black flex items-center justify-center">2</span>
                  <p className="text-xs font-bold text-zinc-400">Paste ChatGPT's response below</p>
                </div>
                <textarea
                  autoFocus
                  rows={10}
                  placeholder={`📅 2026-06-10\nGOAL: SOLID Principles\nCOLOR: orange\nDESCRIPTION: Read Baeldung, create notes\n- SRP\n- OCP\n- LSP\n\n📅 2026-06-11\nGOAL: Design Patterns\nCOLOR: purple\n- Singleton\n- Factory Method`}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-xs text-zinc-300 placeholder:text-zinc-700 font-mono outline-none focus:border-purple-500/40 transition-all resize-none custom-scrollbar leading-relaxed"
                />
              </div>

              {importResult && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-4 px-4 py-3 rounded-xl text-xs font-bold ${
                    importResult.error ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {importResult.error ? `❌ ${importResult.error}` : `✅ Successfully added ${importResult.added} goal${importResult.added !== 1 ? 's' : ''} to your calendar!`}
                </motion.div>
              )}

              <button
                onClick={parseAndImport}
                disabled={!importText.trim()}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
              >
                Import Goals to Calendar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#111113] border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/50"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Flag size={16} className="text-orange-500" />
                  <h3 className="text-sm font-black text-white">{editGoal ? 'Edit Goal' : 'New Goal'}</h3>
                  {selectedKey && (
                    <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                      {new Date(selectedKey + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <button onClick={() => setShowForm(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  autoFocus
                  placeholder="Goal title..."
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-orange-500/50 transition-all"
                />
                <textarea
                  placeholder="Description (optional)..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-400 placeholder:text-zinc-600 outline-none focus:border-orange-500/50 transition-all resize-none custom-scrollbar"
                />

                {/* Color Picker */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Color</p>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        style={{ background: c }}
                        className={`w-6 h-6 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111113] scale-110' : 'opacity-60 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Milestones</p>
                  <div className="space-y-1 mb-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {milestones.map((m, i) => (
                      <div key={m.id} className="flex items-center gap-2 text-xs text-zinc-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 flex-shrink-0" />
                        <span className="flex-1">{m.text}</span>
                        <button onClick={() => setMilestones(prev => prev.filter((_, j) => j !== i))} className="text-zinc-700 hover:text-red-400 transition-colors">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      placeholder="Add milestone..."
                      value={form.milestone}
                      onChange={e => setForm(f => ({ ...f, milestone: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addMilestone()}
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-orange-500/40 transition-all"
                    />
                    <button onClick={addMilestone} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={saveGoal}
                  disabled={!form.title.trim()}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
                >
                  {editGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
