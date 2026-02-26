import TaskCard from './TaskCard';
import { useDroppable } from "@dnd-kit/core";
import { Plus, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../type/task';
import { useState } from 'react';

type ColumnProps = {
  columnTitle: string;
  status: Task["status"];
  tasks: Task[];
  deleteTask: (id: string) => void;
  addTask: (title: string, status: Task["status"]) => void;
  toggleChecklist: (taskId: string, checklistId: string) => void;
  addSubtask: (taskId: string, text: string) => void;
  isFocusMode?: boolean;
  onTaskClick?: (task: Task) => void;
}

const Column = ({ columnTitle, tasks, status, deleteTask, addTask, toggleChecklist, addSubtask, isFocusMode, onTaskClick }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = () => {
    if (newTitle.trim()) {
      addTask(newTitle, status);
      setNewTitle("");
      setIsAdding(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-[320px] lg:w-[350px] flex-col rounded-[2.5rem] p-6 transition-all duration-300",
        "bg-white/40 backdrop-blur-md border border-white/40 shadow-2xl shadow-slate-900/5",
        isOver && "bg-indigo-50/50 ring-2 ring-inset ring-indigo-400/30 scale-[1.01] shadow-indigo-100/50"
      )}
    >
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-2 w-2 rounded-full",
            status === 'todo' ? "bg-slate-400" :
              status === 'doing' ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" :
                "bg-emerald-500"
          )} />
          <h3 className="text-xs font-black tracking-[0.15em] text-slate-800 uppercase">
            {columnTitle}
          </h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-white/60 text-[10px] font-bold text-slate-500 shadow-sm border border-white/50">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/80 hover:text-indigo-600 transition-all border border-transparent hover:border-white/50 shadow-sm"
          >
            <Plus size={16} />
          </button>
          <button className="rounded-xl p-2 text-slate-400 hover:bg-white/80 hover:text-slate-600 transition-all border border-transparent hover:border-white/50 shadow-sm">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 glass p-3 rounded-2xl border border-indigo-100 shadow-lg"
          >
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="What needs doing?"
              className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 mb-2 px-1"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase shadow-lg shadow-indigo-200"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar min-h-0 pt-1">
        {tasks.map((t: Task) => (
          <TaskCard
            key={t.id}
            task={t}
            deleteTask={deleteTask}
            toggleChecklist={toggleChecklist}
            addSubtask={addSubtask}
            isFocusMode={isFocusMode}
            onClick={() => onTaskClick?.(t)}
          />
        ))}

        {tasks.length === 0 && !isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200/40 p-10 text-center bg-slate-50/20"
          >
            <div className="mb-3 rounded-2xl bg-white p-3 text-slate-300 shadow-sm border border-slate-100">
              <Plus size={24} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Empty Orbit</p>
          </motion.div>
        )}
      </div>

      {/* Replaced the big button at the bottom with a more subtle trigger */}
      <button
        onClick={() => setIsAdding(true)}
        className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white/50 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm border border-transparent hover:border-indigo-100 transition-all ring-offset-2"
      >
        <Plus size={14} />
        New Task
      </button>
    </div>
  )
}

export default Column