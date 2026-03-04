import TaskCard from './TaskCard';
import { useDroppable } from "@dnd-kit/core";
import { Plus, Trash2, Clock, ChevronsRight } from "lucide-react";
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
  onPushAll?: () => void;
}

const statusConfig = {
  todo: {
    dot: 'bg-zinc-600',
    label: 'text-zinc-400',
    badge: 'bg-zinc-800 text-zinc-500 border-zinc-700/50',
    glow: '',
    accentBorder: 'border-zinc-800',
    headerBg: 'from-zinc-900/60',
    pushLabel: '→ Active',
    pushTitle: 'Move all to Active',
  },
  doing: {
    dot: 'bg-orange-500',
    label: 'text-zinc-200',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    glow: 'shadow-[0_0_8px_rgba(249,115,22,0.3)]',
    accentBorder: 'border-orange-500/20',
    headerBg: 'from-orange-900/10',
    pushLabel: '→ Done',
    pushTitle: 'Mark all as Done',
  },
  done: {
    dot: 'bg-emerald-500',
    label: 'text-zinc-300',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    glow: '',
    accentBorder: 'border-emerald-500/20',
    headerBg: 'from-emerald-900/10',
    pushLabel: '',
    pushTitle: '',
  },
};

const Column = ({ columnTitle, tasks, status, deleteTask, addTask, toggleChecklist, addSubtask, onTaskClick, onClear, onPushAll }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPushConfirm, setShowPushConfirm] = useState(false);

  const cfg = statusConfig[status];

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
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  const handlePushAll = () => {
    if (tasks.length === 0) return;
    if (showPushConfirm) {
      onPushAll?.();
      setShowPushConfirm(false);
    } else {
      setShowPushConfirm(true);
      setTimeout(() => setShowPushConfirm(false), 3000);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full flex-col rounded-2xl transition-all duration-300 overflow-hidden",
        "bg-[#111111] border",
        isOver ? cn("scale-[1.01]", cfg.accentBorder) : "border-white/[0.06]",
        "shadow-xl shadow-black/30",
      )}
    >
      {/* Column Header */}
      <div className={cn(
        "px-4 pt-4 pb-3 bg-gradient-to-b to-transparent",
        cfg.headerBg,
        "border-b border-white/[0.04] flex-shrink-0"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Status dot */}
            <div className={cn("h-2 w-2 rounded-full flex-shrink-0", cfg.dot, status === 'doing' && cfg.glow)} />
            <h3 className={cn("text-[11px] font-black tracking-[0.12em] uppercase", cfg.label)}>
              {columnTitle}
            </h3>
            <span className={cn("flex h-5 min-w-[20px] items-center justify-center rounded-md px-1.5 text-[9px] font-bold border", cfg.badge)}>
              {tasks.length}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            {/* Push all button — Queue and Active only */}
            {onPushAll && tasks.length > 0 && (
              <AnimatePresence mode="wait">
                {showPushConfirm ? (
                  <motion.button
                    key="push-confirm"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    onClick={handlePushAll}
                    title={cfg.pushTitle}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[8px] font-black uppercase tracking-wider hover:bg-orange-500/30 transition-all"
                  >
                    <ChevronsRight size={9} />
                    Push all?
                  </motion.button>
                ) : (
                  <motion.button
                    key="push"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    onClick={handlePushAll}
                    title={cfg.pushTitle}
                    className="rounded-lg px-2 py-1 text-zinc-700 hover:text-orange-400 hover:bg-orange-500/10 transition-all flex items-center gap-1 text-[9px] font-bold"
                  >
                    <ChevronsRight size={12} />
                  </motion.button>
                )}
              </AnimatePresence>
            )}

            {/* Clear button — Done only */}
            {onClear && tasks.length > 0 && (
              <AnimatePresence mode="wait">
                {showClearConfirm ? (
                  <motion.button
                    key="confirm"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    onClick={handleClear}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-[8px] font-black uppercase tracking-wider hover:bg-red-500/30 transition-all"
                  >
                    <Trash2 size={9} />
                    Confirm
                  </motion.button>
                ) : (
                  <motion.button
                    key="clear"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    onClick={handleClear}
                    className="rounded-lg p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={12} />
                  </motion.button>
                )}
              </AnimatePresence>
            )}

            {/* Add task button */}
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="rounded-lg p-1.5 text-zinc-700 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Done auto-clear badge */}
        {onClear && (
          <div className="flex items-center gap-1.5 mt-2.5">
            <Clock size={8} className="text-emerald-500/40" />
            <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-500/40">
              Clears at midnight
            </span>
          </div>
        )}
      </div>

      {/* Add task inline input */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden flex-shrink-0"
          >
            <div className="mx-3 mt-3 p-3 rounded-xl bg-white/[0.03] border border-orange-500/20 shadow-lg shadow-orange-900/10">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') setIsAdding(false);
                }}
                placeholder="Task title..."
                className="w-full bg-transparent border-none outline-none text-sm font-medium text-zinc-300 placeholder:text-zinc-700 mb-2.5"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-lg shadow-orange-900/30 transition-all active:scale-95"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks list */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 custom-scrollbar min-h-0">
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
            className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.05] p-8 text-center"
          >
            <div className="mb-3 rounded-xl bg-white/[0.03] p-3 text-zinc-800 border border-white/[0.05]">
              <Plus size={18} />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-800">Empty</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Column