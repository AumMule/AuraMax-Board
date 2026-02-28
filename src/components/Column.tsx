import TaskCard from './TaskCard';
import { useDroppable } from "@dnd-kit/core";
import { Plus, MoreHorizontal, Trash2, Clock } from "lucide-react";
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
  onTaskClick?: (task: Task) => void;
  onClear?: () => void;
}

const Column = ({ columnTitle, tasks, status, deleteTask, addTask, toggleChecklist, addSubtask, onTaskClick, onClear }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAdd = () => {
    if (newTitle.trim()) {
      addTask(newTitle, status);
      setNewTitle("");
      setIsAdding(false);
    }
  };

  const handleClear = () => {
    if (showClearConfirm) {
      onClear?.();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      // Auto-dismiss confirm after 3s
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-[300px] lg:w-[330px] flex-col rounded-2xl p-4 transition-all duration-300",
        "bg-white/40 backdrop-blur-md border border-white/40 shadow-xl shadow-slate-900/5",
        isOver && "bg-indigo-50/50 ring-2 ring-inset ring-indigo-400/30 scale-[1.01] shadow-indigo-100/50"
      )}
    >
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "h-2 w-2 rounded-full",
            status === 'todo' ? "bg-slate-400" :
              status === 'doing' ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" :
                "bg-emerald-500"
          )} />
          <h3 className="text-[10px] font-black tracking-[0.15em] text-slate-800 uppercase">
            {columnTitle}
          </h3>
          <span className="flex h-4 w-4 items-center justify-center rounded-md bg-white/60 text-[9px] font-bold text-slate-500 shadow-sm border border-white/50">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Clear button — only for 'done' column */}
          {onClear && tasks.length > 0 && (
            <AnimatePresence mode="wait">
              {showClearConfirm ? (
                <motion.button
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  onClick={handleClear}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white text-[8px] font-black uppercase tracking-wider hover:bg-red-600 transition-all"
                >
                  <Trash2 size={10} />
                  Confirm?
                </motion.button>
              ) : (
                <motion.button
                  key="clear"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  onClick={handleClear}
                  title="Clear all architected tasks"
                  className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <Trash2 size={13} />
                </motion.button>
              )}
            </AnimatePresence>
          )}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/80 hover:text-indigo-600 transition-all"
          >
            <Plus size={14} />
          </button>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/80 hover:text-slate-600 transition-all">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Midnight auto-reset badge — only for done column */}
      {onClear && (
        <div className="mb-2 flex items-center gap-1 px-1">
          <Clock size={8} className="text-emerald-400/60" />
          <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-500/50">
            Auto-clears at midnight
          </span>
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 glass p-2.5 rounded-xl border border-indigo-100 shadow-lg"
          >
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="What needs doing?"
              className="w-full bg-transparent border-none outline-none text-xs font-medium text-slate-700 placeholder:text-slate-400 mb-2 px-1"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-[9px] font-bold uppercase text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md text-[9px] font-bold uppercase shadow-lg shadow-indigo-200"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar min-h-0 pt-0.5">
        {tasks.map((t: Task) => (
          <TaskCard
            key={t.id}
            task={t}
            deleteTask={deleteTask}
            toggleChecklist={toggleChecklist}
            addSubtask={addSubtask}
            onClick={() => onTaskClick?.(t)}
          />
        ))}

        {tasks.length === 0 && !isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200/40 p-6 text-center bg-slate-50/20"
          >
            <div className="mb-2 rounded-xl bg-white p-2 text-slate-300 shadow-sm border border-slate-100">
              <Plus size={18} />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Empty Orbit</p>
          </motion.div>
        )}
      </div>

      <button
        onClick={() => setIsAdding(true)}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-white/50 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm border border-transparent hover:border-indigo-100 transition-all"
      >
        <Plus size={12} />
        New Task
      </button>
    </div>
  )
}

export default Column