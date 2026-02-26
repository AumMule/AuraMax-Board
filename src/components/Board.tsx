import { useState, useEffect, useMemo } from 'react'
import BoardHeader from './BoardHeader'
import Column from './Column'
import { DndContext, DragOverlay, defaultDropAnimationSideEffects, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import TaskCard from './TaskCard';
import { Eye, EyeOff, Search, SlidersHorizontal, Maximize2, Minimize2 } from 'lucide-react';
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
                createdAt: now - 86400000, // 24h ago
                statusChangedAt: now - 3600000, // 1h ago
                checklists: [
                    { id: "c1", text: "Choose color palette", completed: true },
                    { id: "c2", text: "Apply blur filters", completed: false }
                ]
            },
            {
                id: "2",
                title: "Implement Zen Mode",
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
    const [isZenMode, setIsZenMode] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterUrgency, setFilterUrgency] = useState<number | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        localStorage.setItem("kanban-tasks", JSON.stringify(tasks));
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterUrgency ? task.urgency === filterUrgency : true;
            return matchesSearch && matchesFilter;
        });
    }, [tasks, searchQuery, filterUrgency]);

    const columnTitle: { name: string; status: Task["status"] }[] = [
        { name: "Focus Backlog", status: "todo" },
        { name: "In Orbit", status: "doing" },
        { name: "Architected", status: "done" }
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

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(task => task.id !== id));
    }

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
                {/* Subtle gradient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

                {/* Exit button — tiny, top-right corner */}
                <button
                    onClick={() => setIsFocusMode(false)}
                    className="fixed top-8 right-8 z-[1000] px-5 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.12] transition-all text-[10px] font-bold uppercase tracking-[0.2em]"
                >
                    <Minimize2 size={14} className="inline mr-2" />
                    Exit
                </button>

                <div className="relative z-10 max-w-3xl mx-auto px-8 py-24">
                    {/* Doing — primary */}
                    {doingTasks.length > 0 && (
                        <div className="mb-20">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400/60 mb-8">In Orbit</p>
                            <div className="flex flex-col gap-3">
                                {doingTasks.map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group py-4 border-b border-white/[0.04] cursor-pointer"
                                        onClick={() => openTaskDetails(task)}
                                    >
                                        <span className="text-3xl md:text-4xl font-bold text-white/90 tracking-tight leading-tight group-hover:text-indigo-300 transition-colors duration-300">
                                            {task.title}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Todo — secondary */}
                    {todoTasks.length > 0 && (
                        <div className="mb-20">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 mb-8">Backlog</p>
                            <div className="flex flex-col gap-2">
                                {todoTasks.map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="group py-3 border-b border-white/[0.03] cursor-pointer"
                                        onClick={() => openTaskDetails(task)}
                                    >
                                        <span className="text-xl font-medium text-white/30 tracking-tight group-hover:text-white/60 transition-colors duration-300">
                                            {task.title}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Done — faded */}
                    {doneTasks.length > 0 && (
                        <div className="mb-20">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/10 mb-8">Architected</p>
                            <div className="flex flex-col gap-2">
                                {doneTasks.map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="group py-3 border-b border-white/[0.02] cursor-pointer"
                                        onClick={() => openTaskDetails(task)}
                                    >
                                        <span className="text-lg font-medium text-white/15 line-through decoration-white/10 tracking-tight group-hover:text-white/30 transition-colors duration-300">
                                            {task.title}
                                        </span>
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

                <TaskDetailsModal
                    isOpen={isModalOpen}
                    task={selectedTask}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                />
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
            <div className="relative h-screen w-full overflow-hidden">
                <div className={cn(
                    "mesh-bg absolute inset-0 transition-all duration-700",
                    isZenMode && "blur-[12px] saturate-[0.5] scale-105"
                )} />

                <div className="relative z-10 flex h-full flex-col">
                    <div className="flex-shrink-0">
                        <BoardHeader addTask={(title) => addTask(title)} />
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex items-center justify-between px-8 py-4">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/40 backdrop-blur-md border border-white/40 rounded-2xl py-2.5 pl-10 pr-4 w-64 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 ring-indigo-500/10 transition-all shadow-lg shadow-slate-900/5 focus:bg-white/80"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={14} className="text-slate-400" />
                                <div className="flex gap-1">
                                    {[null, 5, 4, 3, 1].map((u) => (
                                        <button
                                            key={u?.toString() || 'all'}
                                            onClick={() => setFilterUrgency(u)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                filterUrgency === u
                                                    ? "bg-slate-900 text-white shadow-lg"
                                                    : "bg-white/40 text-slate-400 hover:bg-white/60"
                                            )}
                                        >
                                            {u === null ? 'All' : u === 5 ? 'Critical' : u === 4 ? 'High' : u === 3 ? 'Mid' : 'Low'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 justify-center overflow-hidden px-8 pb-8 pt-2">
                        <div className={cn(
                            "flex h-full gap-8 overflow-x-auto pb-4 transition-all duration-500",
                            isZenMode ? "max-w-4xl" : "w-full"
                        )}>
                            <AnimatePresence mode='popLayout'>
                                {columnTitle.map((col) => (
                                    (!isZenMode || col.status === 'doing') && (
                                        <motion.div
                                            key={col.status}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                            className="flex-shrink-0 min-h-0 h-full"
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
                                            />
                                        </motion.div>
                                    )
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Bottom controls */}
                <div className="fixed bottom-8 right-8 z-[200] flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsZenMode(!isZenMode)}
                        className={cn(
                            "group flex items-center gap-3 rounded-full px-6 py-4 font-bold text-white shadow-2xl transition-all duration-300",
                            isZenMode
                                ? "bg-indigo-600 ring-4 ring-indigo-400/40"
                                : "bg-slate-900 hover:bg-slate-800"
                        )}
                    >
                        {isZenMode ? <EyeOff size={20} className="text-white" /> : <Eye size={20} className="text-white" />}
                        <span className="tracking-tight">{isZenMode ? "Exit Zen" : "Zen Mode"}</span>
                    </motion.button>

                    <button
                        onClick={() => setIsFocusMode(true)}
                        className="flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-2xl"
                    >
                        <Maximize2 size={16} />
                        <span>Focus Mode</span>
                    </button>
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
        </DndContext>
    )
}

export default Board