import { useState, useEffect } from 'react'
import BoardHeader from './BoardHeader'
import Column from './Column'
import { DndContext, DragOverlay, defaultDropAnimationSideEffects, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import TaskCard from './TaskCard';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface Task {
    id: string;
    title: string;
    status: string;
    priority?: 'low' | 'medium' | 'high';
}

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
        return [
            { id: "1", title: "Refactor to Glassmorphism", status: "doing", priority: 'high' },
            { id: "2", title: "Implement Zen Mode", status: "todo", priority: 'medium' },
            { id: "3", title: "Add AI Sub-tasks", status: "todo", priority: 'low' },
            { id: "4", title: "Initial Project Setup", status: "done", priority: 'low' },
        ];
    });

    const [activeId, setActiveId] = useState<string | null>(null);
    const [isZenMode, setIsZenMode] = useState(false);

    // Add sensor with activation constraint to prevent accidental drags when clicking
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

    const columnTitle = [
        { name: "Focus Backlog", status: "todo" },
        { name: "In Orbit", status: "doing" },
        { name: "Architected", status: "done" }
    ];

    const addTask = (title: string) => {
        const newTask: Task = {
            id: Date.now().toString(),
            title,
            status: "todo",
            priority: 'medium'
        };
        setTasks([...tasks, newTask]);
    }

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(task => task.id !== id));
    }

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const taskId = active.id;
        const newStatus = over.id;

        setTasks((prevTasks) =>
            prevTasks.map((task) =>
                task.id === taskId
                    ? { ...task, status: newStatus }
                    : task
            )
        );
    };

    const activeTask = tasks.find(t => t.id === activeId);

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="relative h-full w-full overflow-hidden">
                {/* Fixed Background Layer with Blur only when in Zen Mode */}
                <div className={cn(
                    "mesh-bg absolute inset-0 transition-all duration-700",
                    isZenMode && "blur-[10px] saturate-[0.5] scale-105"
                )} />

                <div className="relative z-10 flex h-full flex-col">
                    <div className="flex-shrink-0">
                        <BoardHeader addTask={addTask} />
                    </div>

                    {/* Columns Area */}
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
                                            />
                                        </motion.div>
                                    )
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Zen Mode Toggle - Moved outside the content area but inside the relative container to be above blur */}
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
                        <TaskCard task={activeTask} deleteTask={deleteTask} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

export default Board