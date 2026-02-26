import TaskCard from './TaskCard';
import { useDroppable } from "@dnd-kit/core";
import { Plus, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from 'framer-motion';

type Task = {
  id: string | number;
  title: string;
  status: string;
}

type ColumnProps = {
  columnTitle: string;
  status: string;
  tasks: Task[];
  deleteTask: (id: string) => void;
}

const Column = ({ columnTitle, tasks, status, deleteTask }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-[320px] lg:w-[350px] flex-col rounded-[2.5rem] p-6 transition-all duration-300",
        "bg-white/40 backdrop-blur-md border border-white/40 shadow-2xl shadow-slate-900/5",
        isOver && "bg-indigo-50/50 ring-2 ring-indigo-400/20 scale-[1.01]"
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
        <button className="rounded-xl p-2 text-slate-400 hover:bg-white/80 hover:text-slate-600 transition-all border border-transparent hover:border-white/50 shadow-sm">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Task List - Added flex-1 and overflow-y-auto to allow scrolling within the column */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar min-h-0">
        {tasks.map((t: Task) => (
          <TaskCard key={t.id} task={t} deleteTask={deleteTask} />
        ))}

        {tasks.length === 0 && (
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

      <motion.button
        whileTap={{ scale: 0.98 }}
        className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all ring-offset-2 focus:ring-2 ring-slate-900"
      >
        <Plus size={14} />
        Add Task
      </motion.button>
    </div>
  )
}

export default Column