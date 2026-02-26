import { useState, useEffect } from 'react'
import BoardHeader from './BoardHeader'
import Column from './Column'
import { DndContext, DragOverlay, defaultDropAnimationSideEffects, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import TaskCard from './TaskCard';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Task } from '../type/task';

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

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="relative h-full w-full overflow-hidden">
                <div className={cn(
                    "mesh-bg absolute inset-0 transition-all duration-700",
                    isZenMode && "blur-[10px] saturate-[0.5] scale-105"
                )} />

                <div className="relative z-10 flex h-full flex-col">
                    <div className="flex-shrink-0">
                        <BoardHeader addTask={(title) => addTask(title)} />
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
                                            className='flex-shrink-0 min-h-0 h-full'
                                        >
                                            <Column
                                                columnTitle={col.name}
                                                status={col.status}
                                                tasks={tasks.filter(task => task.status === col.status)}
                                                deleteTask={deleteTask}
                                                addTask={addTask}
                                                toggleChecklist={toggleChecklist}
                                                addSubtask={addSubtask}
                                            />
                                        </motion.div>
                                    )
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-8 right-8 z-[100]">
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
                        <span className="tracking-tight">{isZenMode ? "Exit Zen Mode" : "Zen Focus"}</span>
                    </motion.button>
                </div>
            </div>

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