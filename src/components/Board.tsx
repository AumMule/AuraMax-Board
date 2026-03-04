import { useState, useEffect, useMemo, useCallback } from 'react'
import BoardHeader from './BoardHeader'
import Column from './Column'
import { DndContext, DragOverlay, defaultDropAnimationSideEffects, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import TaskCard from './TaskCard';
import { Search, SlidersHorizontal, Maximize2, Minimize2, Undo2, X, CheckSquare, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Task } from '../type/task';
import TaskDetailsModal from './TaskDetailsModal';

const Board = () => {
    const [tasks, setTasks] = useState<Task[]>(() => {
        try {
            const savedTasks = localStorage.getItem("kanban-tasks");
            if (savedTasks) {
                return JSON.parse(savedTasks);
            }
        } catch (error) {
            console.error("Error parsing tasks from localStorage:", error);
        }

        const now = Date.now();
        return [
            {
                id: "1",
                title: "Refactor to Glassmorphism",
                status: "doing",
                urgency: 5,
                impact: 5,
                createdAt: now - 86400000,
                statusChangedAt: now - 3600000,
                checklists: [
                    { id: "c1", text: "Choose color palette", completed: true },
                    { id: "c2", text: "Apply blur filters", completed: false }
                ]
            },
            {
                id: "2",
                title: "Implement Focus Mode",
                status: "todo",
                urgency: 4,
                impact: 4,
                createdAt: now,
                statusChangedAt: now,
                checklists: []
            },
            {
                id: "3",
                title: "Add AI Sub-tasks",
                status: "todo",
                urgency: 3,
                impact: 5,
                createdAt: now,
                statusChangedAt: now,
                checklists: []
            }
        ];
    });

    const [activeId, setActiveId] = useState<string | null>(null);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterUrgency, setFilterUrgency] = useState<number | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [focusExpandedId, setFocusExpandedId] = useState<string | null>(null);

    // Undo delete state
    const [deletedTask, setDeletedTask] = useState<Task | null>(null);
    const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    useEffect(() => {
        localStorage.setItem("kanban-tasks", JSON.stringify(tasks));
    }, [tasks]);

    // ── Auto-reset: clear 'done' tasks at midnight ──────────────────────────
    useEffect(() => {
        const RESET_KEY = "kanban-last-reset";

        const clearDone = () => {
            const today = new Date().toDateString();
            const lastReset = localStorage.getItem(RESET_KEY);
            if (lastReset !== today) {
                setTasks(prev => prev.filter(t => t.status !== 'done'));
                localStorage.setItem(RESET_KEY, today);
            }
        };

        // Check immediately on mount (handles missed midnights while app was closed)
        clearDone();

        // Schedule the next midnight fire
        const scheduleMidnight = () => {
            const now = new Date();
            const nextMidnight = new Date();
            nextMidnight.setHours(24, 0, 0, 0);
            const delay = nextMidnight.getTime() - now.getTime();

            return setTimeout(() => {
                setTasks(prev => prev.filter(t => t.status !== 'done'));
                localStorage.setItem(RESET_KEY, new Date().toDateString());
                // Reschedule for the next midnight
                scheduleMidnight();
            }, delay);
        };

        const timeout = scheduleMidnight();
        return () => clearTimeout(timeout);
    }, []); // Runs once on mount

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterUrgency ? task.urgency === filterUrgency : true;
            return matchesSearch && matchesFilter;
        });
    }, [tasks, searchQuery, filterUrgency]);

    const columnTitle: { name: string; status: Task["status"] }[] = [
        { name: "Queue", status: "todo" },
        { name: "Active", status: "doing" },
        { name: "Done", status: "done" }
    ];

    const addTask = (title: string, status: Task["status"] = "todo") => {
        const now = Date.now();
        const newTask: Task = {
            id: now.toString(),
            title,
            status,
            urgency: 3,
            impact: 3,
            createdAt: now,
            statusChangedAt: now,
            checklists: []
        };
        setTasks([...tasks, newTask]);
    }

    const deleteTask = useCallback((id: string) => {
        const taskToDelete = tasks.find(t => t.id === id);
        if (!taskToDelete) return;

        // Clear any existing undo timer
        if (undoTimer) clearTimeout(undoTimer);

        // Save the deleted task for undo
        setDeletedTask(taskToDelete);
        setTasks(prev => prev.filter(task => task.id !== id));

        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
            setDeletedTask(null);
        }, 5000);
        setUndoTimer(timer);
    }, [tasks, undoTimer]);

    const undoDelete = useCallback(() => {
        if (deletedTask) {
            setTasks(prev => [...prev, deletedTask]);
            setDeletedTask(null);
            if (undoTimer) clearTimeout(undoTimer);
            setUndoTimer(null);
        }
    }, [deletedTask, undoTimer]);

    const dismissUndo = useCallback(() => {
        setDeletedTask(null);
        if (undoTimer) clearTimeout(undoTimer);
        setUndoTimer(null);
    }, [undoTimer]);

    const clearDoneTasks = useCallback(() => {
        setTasks(prev => prev.filter(t => t.status !== 'done'));
        localStorage.setItem("kanban-last-reset", new Date().toDateString());
    }, []);

    const updateTask = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    }

    const toggleChecklist = (taskId: string, checklistId: string) => {
        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    checklists: (task.checklists || []).map(item =>
                        item.id === checklistId ? { ...item, completed: !item.completed } : item
                    )
                };
            }
            return task;
        }));
    };

    const addSubtask = (taskId: string, text: string) => {
        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                const newSubtask = {
                    id: Date.now().toString(),
                    text,
                    completed: false
                };
                return {
                    ...task,
                    checklists: [...(task.checklists || []), newSubtask]
                };
            }
            return task;
        }));
    };

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (over) {
            const taskId = active.id;
            const newStatus = over.id as Task["status"];

            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task.id === taskId
                        ? { ...task, status: newStatus, statusChangedAt: Date.now() }
                        : task
                )
            );
        }

        setActiveId(null);
    };

    const activeTask = tasks.find(t => t.id === activeId);

    const openTaskDetails = (task: Task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    // Push all tasks in a column to the next status
    const pushAllTasks = (fromStatus: Task['status']) => {
        const nextStatus: Record<Task['status'], Task['status']> = {
            todo: 'doing',
            doing: 'done',
            done: 'todo', // no-op but satisfies types
        };
        const next = nextStatus[fromStatus];
        setTasks(prev => prev.map(t =>
            t.status === fromStatus ? { ...t, status: next, statusChangedAt: Date.now() } : t
        ));
    };

    const UndoToast = () => (
        <AnimatePresence>
            {deletedTask && (
                <motion.div
                    initial={{ opacity: 0, y: 80, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 80, scale: 0.9 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-4 bg-[#1a1a1a] backdrop-blur-xl border border-white/10 text-zinc-200 px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/60"
                >
                    <span className="text-sm font-medium text-zinc-400">
                        Deleted&nbsp;<span className="font-bold text-zinc-200">&ldquo;{deletedTask.title}&rdquo;</span>
                    </span>
                    <button
                        onClick={undoDelete}
                        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/40"
                    >
                        <Undo2 size={12} />
                        Undo
                    </button>
                    <button
                        onClick={dismissUndo}
                        className="text-zinc-700 hover:text-zinc-400 transition-colors p-1"
                    >
                        <X size={14} />
                    </button>
                    {/* Progress bar */}
                    <motion.div
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500/60 origin-left rounded-b-2xl"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Inline detail renderer for Focus Mode
    const FocusTaskItem = ({ task, variant }: { task: Task; variant: 'primary' | 'secondary' | 'done' }) => {
        const isExpanded = focusExpandedId === task.id;
        const completedCount = task.checklists?.filter(i => i.completed).length || 0;
        const totalCount = task.checklists?.length || 0;
        const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== 'done';

        return (
            <motion.div
                layout
                className={cn(
                    "border-b cursor-pointer transition-colors duration-300",
                    variant === 'primary' ? "border-white/[0.04]" :
                        variant === 'secondary' ? "border-white/[0.03]" : "border-white/[0.02]"
                )}
                onClick={() => setFocusExpandedId(isExpanded ? null : task.id)}
            >
                {/* Title row */}
                <div className="py-3 group">
                    <div className="flex items-baseline gap-3">
                        <span className={cn(
                            "tracking-tight leading-tight transition-colors duration-300",
                            variant === 'primary' && "text-2xl md:text-3xl font-bold text-white/90 group-hover:text-orange-300",
                            variant === 'secondary' && "text-lg font-medium text-white/30 group-hover:text-white/60",
                            variant === 'done' && "text-base font-medium text-white/15 line-through decoration-white/10 group-hover:text-white/30"
                        )}>
                            {task.title}
                        </span>
                        {task.dueDate && variant === 'primary' && (
                            <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wider flex-shrink-0",
                                isOverdue ? "text-red-400" : "text-white/20"
                            )}>
                                {isOverdue ? "OVERDUE" : `${Math.ceil((task.dueDate - Date.now()) / 86400000)}d`}
                            </span>
                        )}
                        {totalCount > 0 && variant !== 'done' && (
                            <span className="text-[9px] font-bold text-white/15 flex-shrink-0">
                                {completedCount}/{totalCount}
                            </span>
                        )}
                    </div>
                </div>

                {/* Expanded inline details */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="pb-5 pl-1 flex flex-col gap-4">
                                {/* Meta row */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                        task.urgency >= 5 ? "bg-red-500/20 text-red-400" :
                                            task.urgency >= 4 ? "bg-orange-500/20 text-orange-400" :
                                                task.urgency >= 3 ? "bg-amber-500/20 text-amber-400" :
                                                    "bg-[#18181b]/5 text-white/30"
                                    )}>
                                        <AlertCircle size={8} className="inline mr-1" />
                                        {task.urgency >= 5 ? 'Critical' : task.urgency >= 4 ? 'High' : task.urgency >= 3 ? 'Medium' : 'Low'}
                                    </div>
                                    <div className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[8px] font-black uppercase tracking-widest">
                                        <TrendingUp size={8} className="inline mr-1" />
                                        Impact {task.impact}
                                    </div>
                                    {task.dueDate && (
                                        <div className={cn(
                                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                            isOverdue ? "bg-red-500/20 text-red-400" : "bg-[#18181b]/5 text-white/25"
                                        )}>
                                            <Clock size={8} className="inline mr-1" />
                                            {isOverdue ? 'Overdue' : `Due ${new Date(task.dueDate).toLocaleDateString()}`}
                                        </div>
                                    )}
                                    {task.tags?.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 rounded-full bg-[#18181b]/5 text-white/25 text-[8px] font-bold uppercase tracking-widest">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Description */}
                                {task.description && (
                                    <p className="text-sm font-medium text-white/30 leading-relaxed max-w-xl">
                                        {task.description}
                                    </p>
                                )}

                                {/* Subtasks / Checklist */}
                                {totalCount > 0 && (
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">
                                            <CheckSquare size={10} />
                                            Subtasks
                                            <span className="text-white/10">{completedCount}/{totalCount}</span>
                                        </div>
                                        {task.checklists?.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleChecklist(task.id, item.id);
                                                }}
                                                className="flex items-center gap-2.5 py-1 px-2 rounded-lg hover:bg-[#18181b]/[0.03] transition-colors cursor-pointer group/sub"
                                            >
                                                <div className={cn(
                                                    "h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                                                    item.completed ? "bg-orange-500 border-orange-500" : "border-white/15 bg-transparent"
                                                )}>
                                                    {item.completed && <div className="w-1.5 h-1.5 bg-[#18181b] rounded-full" />}
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-medium transition-colors",
                                                    item.completed ? "text-white/20 line-through" : "text-white/50 group-hover/sub:text-white/70"
                                                )}>
                                                    {item.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* No details fallback */}
                                {!task.description && totalCount === 0 && !task.dueDate && (
                                    <p className="text-xs text-white/15 italic">No details added yet.</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    // Focus Mode: completely separate fullscreen view
    if (isFocusMode) {
        const doingTasks = tasks.filter(t => t.status === 'doing');
        const todoTasks = tasks.filter(t => t.status === 'todo');
        const doneTasks = tasks.filter(t => t.status === 'done');

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[999] bg-[#06080c] overflow-y-auto"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

                <button
                    onClick={() => setIsFocusMode(false)}
                    className="fixed top-8 right-8 z-[1000] px-5 py-2.5 rounded-full bg-[#18181b]/[0.06] border border-white/[0.08] text-white/40 hover:text-white hover:bg-[#18181b]/[0.12] transition-all text-[10px] font-bold uppercase tracking-[0.2em]"
                >
                    <Minimize2 size={14} className="inline mr-2" />
                    Exit
                </button>

                <div className="relative z-10 max-w-3xl mx-auto px-8 py-20">
                    {doingTasks.length > 0 && (
                        <div className="mb-16">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400/60 mb-6">In Orbit</p>
                            <div className="flex flex-col">
                                {doingTasks.map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <FocusTaskItem task={task} variant="primary" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {todoTasks.length > 0 && (
                        <div className="mb-16">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 mb-6">Backlog</p>
                            <div className="flex flex-col">
                                {todoTasks.map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                    >
                                        <FocusTaskItem task={task} variant="secondary" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {doneTasks.length > 0 && (
                        <div className="mb-16">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/10 mb-6">Architected</p>
                            <div className="flex flex-col">
                                {doneTasks.map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <FocusTaskItem task={task} variant="done" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-white/10">
                            <p className="text-2xl font-bold tracking-tight">Nothing here yet.</p>
                        </div>
                    )}
                </div>

                <UndoToast />
            </motion.div>
        );
    }

    // Normal board view
    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="relative h-full w-full overflow-hidden">
                <div className="mesh-bg absolute inset-0" />

                <div className="relative z-10 flex h-full flex-col">
                    {/* Unified Action Bar */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between px-5 py-3 gap-3 flex-shrink-0 border-b border-white/[0.04] bg-[#0d0d0d]/60 backdrop-blur-md">
                        {/* LEFT SIDE: Summon Task Component */}
                        <div className="w-full xl:w-min">
                            <BoardHeader addTask={(title) => addTask(title)} />
                        </div>

                        {/* RIGHT SIDE: Search, Filter, Focus */}
                        <div className="flex flex-col md:flex-row md:items-center gap-3 lg:gap-4 w-full xl:w-auto">
                            {/* Search */}
                            <div className="relative group w-full md:w-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-orange-500 transition-colors" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 pl-9 pr-4 w-full md:w-52 lg:w-64 outline-none text-sm font-medium text-zinc-300 placeholder:text-zinc-700 focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/20 transition-all"
                                />
                            </div>

                            {/* Filter and Focus Wrapper for smooth responsive collapsing */}
                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end overflow-hidden">
                                {/* Filter Toggle */}
                                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0 max-w-full flex-shrink-0">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={cn(
                                            "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex-shrink-0",
                                            isFilterOpen || filterUrgency
                                                ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                                                : "bg-white/[0.04] text-zinc-600 hover:text-zinc-300 border border-white/[0.08]"
                                        )}
                                    >
                                        <SlidersHorizontal size={12} />
                                        Filter
                                        {filterUrgency && (
                                            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isFilterOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className="flex gap-1 overflow-hidden"
                                            >
                                                <div className="flex items-center gap-1 min-w-max pl-1">
                                                    {[null, 5, 4, 3, 1].map((u) => (
                                                        <button
                                                            key={u?.toString() || 'all'}
                                                            onClick={() => setFilterUrgency(u)}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all",
                                                                filterUrgency === u
                                                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-900/30"
                                                                    : "bg-white/[0.04] text-zinc-600 hover:text-zinc-300 border border-white/[0.06]"
                                                            )}
                                                        >
                                                            {u === null ? 'All' : u === 5 ? 'Critical' : u === 4 ? 'High' : u === 3 ? 'Mid' : 'Low'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Focus Mode */}
                                <button
                                    onClick={() => setIsFocusMode(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-2 flex-shrink-0 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/[0.04] text-zinc-400 hover:bg-orange-500/10 hover:text-orange-400 border border-white/[0.08] hover:border-orange-500/20 transition-all"
                                >
                                    <Maximize2 size={12} />
                                    Focus
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 gap-5 overflow-x-auto overflow-y-hidden px-5 pb-5 pt-4 min-h-0 board-scroll">
                        <AnimatePresence mode='popLayout'>
                            {columnTitle.map((col) => (
                                <motion.div
                                    key={col.status}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 16 }}
                                    className="flex-shrink-0 lg:flex-1 w-[min(85vw,320px)] md:w-[320px] lg:min-w-[280px] lg:max-w-[420px] min-h-0 h-full"
                                >
                                    <Column
                                        columnTitle={col.name}
                                        status={col.status}
                                        tasks={filteredTasks.filter(task => task.status === col.status)}
                                        deleteTask={deleteTask}
                                        addTask={addTask}
                                        toggleChecklist={toggleChecklist}
                                        addSubtask={addSubtask}
                                        onTaskClick={openTaskDetails}
                                        onClear={col.status === 'done' ? clearDoneTasks : undefined}
                                        onPushAll={col.status !== 'done' ? () => pushAllTasks(col.status) : undefined}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>


            </div>

            <TaskDetailsModal
                isOpen={isModalOpen}
                task={selectedTask}
                onClose={() => setIsModalOpen(false)}
                onUpdate={updateTask}
                onDelete={deleteTask}
            />

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.4',
                        },
                    },
                }),
            }}>
                {activeId && activeTask ? (
                    <div className="scale-105 rotate-[2deg] cursor-grabbing shadow-2xl">
                        <TaskCard task={activeTask} deleteTask={deleteTask} isOverlay={true} />
                    </div>
                ) : null}
            </DragOverlay>

            <UndoToast />
        </DndContext>
    )
}

export default Board