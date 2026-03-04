import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, CheckCircle, Flame, ArrowRight, BrainCircuit, Send } from 'lucide-react';
import type { Task } from '../type/task';

type DayPlan = {
    id: string;
    title: string;
    items: string[];
};

const Goals = () => {
    const [syllabusText, setSyllabusText] = useState("");
    const [plans, setPlans] = useState<DayPlan[]>(() => {
        try {
            const saved = localStorage.getItem("goals-plans");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        localStorage.setItem("goals-plans", JSON.stringify(plans));
    }, [plans]);

    const generatePlan = () => {
        if (!syllabusText.trim()) return;
        setIsGenerating(true);

        // Simulate AI parsing delay
        setTimeout(() => {
            const lines = syllabusText.split('\n').filter(l => l.trim().length > 0);
            const parsedPlans: DayPlan[] = [];
            let currentDay: DayPlan | null = null;
            let currentSection = "";

            lines.forEach(line => {
                const tLine = line.trim();
                if (tLine.toLowerCase().startsWith('day ') || tLine.toLowerCase().startsWith('week ')) {
                    if (currentDay) parsedPlans.push(currentDay);
                    currentDay = { id: crypto.randomUUID(), title: tLine, items: [] };
                    currentSection = "";
                } else if (tLine.endsWith(':')) {
                    currentSection = tLine;
                    if (currentDay) currentDay.items.push(`---${tLine}---`); // Special marker for sections
                } else {
                    if (currentDay) {
                        currentDay.items.push(currentSection ? `${tLine}` : tLine);
                    } else {
                        // Implicit first day if doesn't start with "Day"
                        currentDay = { id: crypto.randomUUID(), title: "General", items: [tLine] };
                    }
                }
            });

            if (currentDay) parsedPlans.push(currentDay);

            setPlans(parsedPlans);
            setIsGenerating(false);
        }, 800);
    };

    const sendToBoard = (plan: DayPlan) => {
        const existingTasksStr = localStorage.getItem("kanban-tasks");
        const existingTasks: Task[] = existingTasksStr ? JSON.parse(existingTasksStr) : [];
        const now = Date.now();

        const newTasks: Task[] = [];
        let timeOffset = 0;

        plan.items.forEach(item => {
            if (item.startsWith("---") && item.endsWith("---")) return; // skip section headers
            newTasks.push({
                id: (now + timeOffset).toString(),
                title: item,
                status: "todo",
                urgency: 3,
                impact: 3,
                createdAt: now + timeOffset,
                statusChangedAt: now + timeOffset,
                checklists: [],
                tags: [plan.title]
            });
            timeOffset++;
        });

        localStorage.setItem("kanban-tasks", JSON.stringify([...existingTasks, ...newTasks]));
        // Simple visual confirmation for user
        const btn = document.getElementById(`send-btn-${plan.id}`);
        if (btn) {
            const oldHtml = btn.innerHTML;
            btn.innerHTML = '<span class="text-[9px] font-black uppercase tracking-widest text-emerald-600">Sent!</span>';
            setTimeout(() => btn.innerHTML = oldHtml, 2000);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-10 relative">
            <div className="mesh-bg absolute inset-0 -z-10" />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                            <BrainCircuit className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">AI Planner</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Syllabus-to-Goals Engine</p>
                        </div>
                    </div>
                </div>

                {plans.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/60 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-3xl shadow-2xl shadow-slate-900/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl" />

                        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <FileText size={18} className="text-indigo-500" />
                            Paste your raw syllabus or concepts:
                        </h2>
                        <textarea
                            className="w-full h-64 bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-4 text-sm font-medium text-slate-600 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all custom-scrollbar resize-none"
                            placeholder="e.g.&#10;Week 1 – Core Coding&#10;Day 1 – OOP Basics&#10;&#10;Revise:&#10;Class & Object&#10;Encapsulation&#10;..."
                            value={syllabusText}
                            onChange={(e) => setSyllabusText(e.target.value)}
                        />

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={generatePlan}
                                disabled={isGenerating || !syllabusText.trim()}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10"
                            >
                                {isGenerating ? (
                                    <span className="flex items-center gap-2"><Sparkles className="animate-spin" size={16} /> Parsing...</span>
                                ) : (
                                    <span className="flex items-center gap-2"><Sparkles size={16} /> Generate Daily Plan</span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-white/50">
                            <div className="flex items-center gap-3">
                                <Flame className="text-orange-500" size={20} />
                                <span className="font-bold text-slate-700">Your Action Plan is Ready</span>
                            </div>
                            <button
                                onClick={() => setPlans([])}
                                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors"
                            >
                                Start Over
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {plans.map((plan, i) => (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="h-[420px] flex flex-col bg-white/60 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all"
                                    >
                                        <h3 className="text-lg font-black text-slate-800 mb-4 pb-3 border-b border-slate-200/50 flex items-center gap-2 flex-shrink-0">
                                            <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                                                <ArrowRight size={14} />
                                            </span>
                                            {plan.title}
                                        </h3>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                            {plan.items.map((item, idx) => {
                                                if (item.startsWith('---') && item.endsWith('---')) {
                                                    return (
                                                        <div key={idx} className="mt-4 first:mt-0 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                                            {item.replace(/---/g, '')}
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <div key={idx} className="flex items-start gap-2.5 group cursor-pointer">
                                                        <div className="mt-0.5">
                                                            <div className="w-4 h-4 rounded-md border-2 border-slate-300 group-hover:border-indigo-500 flex items-center justify-center transition-colors">
                                                                <CheckCircle className="w-2.5 h-2.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-600 leading-snug group-hover:text-slate-900 transition-colors">
                                                            {item}
                                                        </p>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-200/50 flex-shrink-0">
                                            <button
                                                id={`send-btn-${plan.id}`}
                                                onClick={() => sendToBoard(plan)}
                                                className="w-full py-2.5 hover:bg-indigo-600 rounded-xl bg-slate-900 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:scale-[1.02] active:scale-95"
                                                title="Send tasks to Kanban Board"
                                            >
                                                <Send size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Send to Board</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Goals;
