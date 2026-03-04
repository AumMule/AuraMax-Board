import { useDraggable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, GripVertical, Clock, CheckSquare, AlertCircle, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import type { Task } from "../type/task";
import { useState, useMemo } from "react";

const STUCK_THRESHOLD = 172800000; // 48 hours
const URGENT_PULSE_THRESHOLD = 86400000; // 24 hours

const TaskCard = ({ task, deleteTask, toggleChecklist, addSubtask, isOverlay, isFocusMode, onClick }: {
  task: Task;
  deleteTask: (id: string) => void;
  toggleChecklist?: (taskId: string, checklistId: string) => void;
  addSubtask?: (taskId: string, text: string) => void;
  isOverlay?: boolean;
  isFocusMode?: boolean;
  onClick?: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: isOverlay
  });

  const now = Date.now();
  const timeInStatus = now - task.statusChangedAt;
  const isStuck = task.status === 'doing' && timeInStatus > STUCK_THRESHOLD;
  const shouldPulseUrgent = task.urgency >= 4 && (now - task.createdAt) > URGENT_PULSE_THRESHOLD;
  const isOverdue = task.dueDate && task.dueDate < now && task.status !== 'done';

  const checklistProgress = useMemo(() => {
    if (!task.checklists?.length) return 0;
    const completed = task.checklists?.filter(i => i.completed).length || 0;
    return (completed / task.checklists.length) * 100;
  }, [task.checklists]);

  const urgencyConfig = useMemo(() => {
    if (task.urgency >= 5) return { label: "Critical", color: "bg-red-500/15 text-red-400 border-red-500/20", dot: "bg-red-500" };
    if (task.urgency >= 4) return { label: "High", color: "bg-orange-500/15 text-orange-400 border-orange-500/20", dot: "bg-orange-500" };
    if (task.urgency >= 3) return { label: "Medium", color: "bg-amber-500/10 text-amber-500 border-amber-500/15", dot: "bg-amber-500" };
    return { label: "Low", color: "bg-zinc-800 text-zinc-600 border-zinc-700/50", dot: "bg-zinc-600" };
  }, [task.urgency]);

  const style = transform && !isOverlay ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <motion.div
      layout
      initial={isOverlay ? false : { opacity: 0, y: 8 }}
      animate={{
        opacity: isDragging && !isOverlay ? 0 : 1,
        y: 0,
        boxShadow: shouldPulseUrgent
          ? ["0 0 0px rgba(249, 115, 22, 0)", "0 0 16px rgba(249, 115, 22, 0.12)", "0 0 0px rgba(249, 115, 22, 0)"]
          : "0 2px 12px rgba(0,0,0,0.3)"
      }}
      transition={{
        boxShadow: shouldPulseUrgent ? { repeat: Infinity, duration: 2.5 } : { duration: 0.2 }
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={(!isDragging && !isOverlay && !isFocusMode) ? { y: -1 } : {}}
      className={cn(
        "group relative flex flex-col transition-all duration-200",
        isFocusMode
          ? "w-full max-w-2xl bg-transparent border-none p-0 items-center justify-center text-center scale-110"
          : cn(
            "gap-2 rounded-xl p-3.5 border cursor-pointer",
            isStuck
              ? "bg-amber-500/5 border-amber-500/20"
              : "bg-[#1a1a1a] border-white/[0.07] hover:border-white/[0.12] hover:bg-[#1e1e1e]",
            task.color ? "" : ""
          ),
        isDragging && !isOverlay ? "opacity-0 invisible" : "opacity-100 visible",
        isOverlay ? "cursor-grabbing" : ""
      )}
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: !isFocusMode && task.color ? task.color + '22' : undefined,
        borderColor: !isFocusMode && task.color ? task.color + '44' : undefined,
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
        onClick?.();
      }}
    >
      {/* Overdue ribbon */}
      {isOverdue && !isFocusMode && (
        <div className="flex items-center gap-1 text-[8px] font-bold uppercase text-red-400 mb-0.5">
          <AlertCircle size={8} />
          Overdue
        </div>
      )}

      {/* Stuck Badge */}
      {isStuck && !isFocusMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1 text-[8px] font-bold uppercase text-amber-500 self-start"
        >
          <AlertCircle size={8} />
          Stuck
        </motion.div>
      )}

      {/* Cover Image */}
      {!isFocusMode && task.coverImage && (
        <div className="w-full h-14 rounded-lg overflow-hidden border border-white/[0.06]">
          <img src={task.coverImage} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      {/* Main row */}
      <div className={cn("flex items-start justify-between gap-2", isFocusMode && "justify-center w-full")}>
        <div className={cn("flex items-start gap-2", isFocusMode && "flex-col gap-4 items-center")}>
          {/* Drag Handle */}
          {!isFocusMode && (
            <div className="mt-0.5 text-zinc-800 group-hover:text-zinc-600 transition-colors flex-shrink-0">
              <GripVertical size={11} />
            </div>
          )}
          <div className={cn("flex flex-col gap-1", isFocusMode && "items-center")}>
            <span className={cn(
              "font-semibold tracking-tight leading-snug",
              isFocusMode
                ? "text-5xl md:text-7xl text-white font-black drop-shadow-2xl"
                : "text-[13px] text-zinc-200",
            )}>
              {task.title}
            </span>

            {/* Urgency & impact badges */}
            {!isFocusMode && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border transition-colors",
                  urgencyConfig.color
                )}>
                  {urgencyConfig.label}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  I·{task.impact}
                </span>
                {task.tags?.slice(0, 1).map(tag => (
                  <span key={tag} className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-white/[0.04] text-zinc-600 border border-white/[0.06]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!isFocusMode && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-zinc-700 hover:bg-white/[0.05] hover:text-zinc-400 transition-all"
            >
              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-zinc-700 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Checklist progress bar */}
      {!isFocusMode && task.checklists?.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="h-[2px] w-full bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${checklistProgress}%` }}
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                checklistProgress === 100 ? "bg-emerald-500" : "bg-orange-500"
              )}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[8px] text-zinc-700">
              <CheckSquare size={8} />
              <span>{task.checklists?.filter(i => i.completed).length || 0}/{task.checklists?.length || 0}</span>
            </div>
            <span className="text-[8px] text-zinc-700">{Math.round(checklistProgress)}%</span>
          </div>
        </div>
      )}

      {/* Expanded Checklist */}
      <AnimatePresence>
        {isExpanded && !isFocusMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-0.5 border-t border-white/[0.05] pt-2"
          >
            {task.checklists?.map((item) => (
              <div
                key={item.id}
                onClick={(e) => { e.stopPropagation(); toggleChecklist?.(task.id, item.id); }}
                className="flex items-center gap-2 cursor-pointer py-0.5 px-1.5 rounded-lg hover:bg-white/[0.03] transition-all"
              >
                <div className={cn(
                  "h-3 w-3 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                  item.completed ? "bg-emerald-500 border-emerald-500" : "border-zinc-700 bg-transparent"
                )}>
                  {item.completed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all",
                  item.completed ? "text-zinc-700 line-through" : "text-zinc-400"
                )}>
                  {item.text}
                </span>
              </div>
            ))}

            {/* Quick Add Subtask */}
            <div className="mt-1.5 flex items-center gap-1.5 px-1">
              <input
                type="text"
                placeholder="Add subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubtask.trim()) {
                    addSubtask?.(task.id, newSubtask);
                    setNewSubtask("");
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-md px-2 py-0.5 text-[9px] font-medium text-zinc-400 outline-none focus:border-orange-500/30 transition-colors placeholder:text-zinc-700"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (newSubtask.trim()) { addSubtask?.(task.id, newSubtask); setNewSubtask(""); }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1 rounded-md bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all"
              >
                <Plus size={9} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer row: due date + elapsed time + avatar */}
      {!isFocusMode && (
        <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.05]">
          <div className="flex items-center gap-1.5">
            {task.dueDate ? (
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-bold",
                isOverdue
                  ? "bg-red-500/15 text-red-400 border border-red-500/20"
                  : "bg-white/[0.05] text-zinc-500 border border-white/[0.06]"
              )}>
                <Clock size={8} />
                {isOverdue ? "Overdue" : `${Math.ceil((task.dueDate - now) / 86400000)}d left`}
              </div>
            ) : task.status === 'doing' ? (
              // Active task — show elapsed time prominently in orange
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[8px] font-bold">
                <Clock size={8} />
                {Math.floor(timeInStatus / 3600000) > 0
                  ? `${Math.floor(timeInStatus / 3600000)}h active`
                  : `${Math.floor(timeInStatus / 60000)}m active`
                }
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-500 border border-white/[0.05] text-[8px] font-medium">
                <Clock size={8} />
                {Math.floor((now - task.createdAt) / 3600000)}h ago
              </div>
            )}
          </div>

          <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center text-[7px] font-bold text-zinc-400">
            {task.title[0].toUpperCase()}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TaskCard;
