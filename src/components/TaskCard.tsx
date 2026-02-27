import { useDraggable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, GripVertical, Clock, CheckSquare, AlertCircle, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import type { Task } from "../type/task";
import { useState, useMemo } from "react";

const STUCK_THRESHOLD = 172800000; // 48 hours in ms
const URGENT_PULSE_THRESHOLD = 86400000; // 24 hours in ms

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

  const checklistProgress = useMemo(() => {
    if (!task.checklists?.length) return 0;
    const completed = task.checklists?.filter(i => i.completed).length || 0;
    return (completed / task.checklists.length) * 100;
  }, [task.checklists]);

  const urgencyConfig = useMemo(() => {
    if (task.urgency >= 5) return { label: "CRITICAL", color: "bg-red-500 text-white" };
    if (task.urgency >= 4) return { label: "HIGH", color: "bg-orange-100 text-orange-600" };
    if (task.urgency >= 3) return { label: "MEDIUM", color: "bg-amber-100 text-amber-600" };
    return { label: "LOW", color: "bg-slate-100 text-slate-500" };
  }, [task.urgency]);

  const style = transform && !isOverlay ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <motion.div
      layout
      initial={isOverlay ? false : { opacity: 0, y: 10 }}
      animate={{
        opacity: isDragging && !isOverlay ? 0 : 1,
        y: 0,
        boxShadow: shouldPulseUrgent
          ? ["0 0 0px rgba(239, 68, 68, 0)", "0 0 12px rgba(239, 68, 68, 0.15)", "0 0 0px rgba(239, 68, 68, 0)"]
          : "0 2px 4px -1px rgb(0 0 0 / 0.06)"
      }}
      transition={{
        boxShadow: shouldPulseUrgent ? { repeat: Infinity, duration: 2 } : { duration: 0.2 }
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={(!isDragging && !isOverlay) ? { scale: 1.01, y: -1 } : {}}
      className={cn(
        "group relative flex flex-col transition-all duration-300",
        isFocusMode
          ? "w-full max-w-2xl bg-transparent border-none p-0 items-center justify-center text-center scale-110 drop-shadow-[0_0_30px_rgba(99,102,241,0.2)]"
          : "gap-1.5 rounded-xl p-3 glass border border-white/40 shadow-slate-900/5",
        isStuck && !isFocusMode && "bg-amber-50/50 border-amber-200/50 outline outline-1 outline-amber-400/20",
        !isDragging && !isOverlay && !isFocusMode && "hover:shadow-lg hover:border-indigo-200/50 hover:bg-white/90",
        !isDragging && !isOverlay && isFocusMode && "hover:border-indigo-500/50 hover:bg-slate-900/80",
        isDragging && !isOverlay ? "opacity-0 invisible" : "opacity-100 visible",
        isOverlay ? "cursor-grabbing" : "cursor-grab"
      )}
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: !isFocusMode && task.color ? task.color : undefined,
        borderColor: !isFocusMode && task.color ? 'rgba(0,0,0,0.05)' : undefined
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
        onClick?.();
      }}
    >
      {/* Stuck Alert Badge */}
      <AnimatePresence>
        {isStuck && !isFocusMode && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1 text-[8px] font-black uppercase text-amber-600 bg-amber-100/50 px-1.5 py-0.5 rounded-full self-start w-fit"
          >
            <AlertCircle size={8} />
            Stuck
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cover Image Preview — compact */}
      {!isFocusMode && task.coverImage && (
        <div className="w-full h-14 rounded-lg overflow-hidden border border-white/20 shadow-sm">
          <img src={task.coverImage} className="w-full h-full object-cover" alt="Task preview" />
        </div>
      )}

      <div className={cn("flex items-start justify-between", isFocusMode && "justify-center w-full")}>
        <div className={cn("flex items-center gap-2", isFocusMode && "flex-col gap-6")}>
          {!isFocusMode && (
            <div className="flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors">
              <GripVertical size={12} />
            </div>
          )}
          <div className={cn("flex flex-col gap-0.5", isFocusMode && "items-center")}>
            <span className={cn(
              "font-bold tracking-tight leading-snug",
              isFocusMode
                ? "text-5xl md:text-7xl text-white font-black drop-shadow-2xl"
                : "text-[13px] text-slate-700",
              isStuck && !isFocusMode ? "text-slate-800" : ""
            )}>
              {task.title}
            </span>

            {!isFocusMode && (
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-[7px] font-black uppercase tracking-widest px-1 py-px rounded transition-colors",
                  urgencyConfig.color
                )}>
                  {urgencyConfig.label}
                </span>
                <span className="text-[7px] font-black uppercase tracking-widest px-1 py-px rounded bg-blue-50 text-blue-500">
                  I:{task.impact}
                </span>
              </div>
            )}
          </div>
        </div>

        {!isFocusMode && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
            >
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar for Checklists */}
      {!isFocusMode && task.checklists?.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
            <div className="flex items-center gap-1">
              <CheckSquare size={9} />
              <span>{task.checklists?.filter(i => i.completed).length || 0}/{task.checklists?.length || 0}</span>
            </div>
            <span>{Math.round(checklistProgress)}%</span>
          </div>
          <div className="h-0.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${checklistProgress}%` }}
              className={cn(
                "h-full transition-all duration-500",
                checklistProgress === 100 ? "bg-emerald-500" : "bg-indigo-500"
              )}
            />
          </div>
        </div>
      )}

      {/* Expanded Checklist View */}
      <AnimatePresence>
        {isExpanded && !isFocusMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-0.5 mt-1 border-t border-slate-100 pt-2"
          >
            {task.checklists?.map((item) => (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleChecklist?.(task.id, item.id);
                }}
                className="flex items-center gap-2 cursor-pointer group/check p-0.5 px-1.5 rounded-md hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                <div className={cn(
                  "h-3 w-3 rounded border flex items-center justify-center transition-all flex-shrink-0",
                  item.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"
                )}>
                  {item.completed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all",
                  item.completed ? "text-slate-400 line-through" : "text-slate-600"
                )}>
                  {item.text}
                </span>
              </div>
            ))}

            {/* Quick Add Subtask */}
            <div className="mt-1.5 flex items-center gap-1.5 px-1.5 pb-0.5">
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
                className="flex-1 bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-[9px] font-medium outline-none focus:border-indigo-200 transition-colors"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (newSubtask.trim()) {
                    addSubtask?.(task.id, newSubtask);
                    setNewSubtask("");
                  }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-0.5 rounded bg-indigo-50 text-indigo-500 hover:bg-indigo-100"
              >
                <Plus size={9} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isFocusMode && (
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/50">
          <div className="flex items-center gap-2">
            {task.dueDate ? (
              <div className={cn(
                "flex items-center gap-1 px-1.5 py-px rounded-full text-[8px] font-bold uppercase tracking-wider",
                task.dueDate < Date.now() && task.status !== 'done'
                  ? "bg-red-50 text-red-500 animate-pulse"
                  : "bg-slate-100/50 text-slate-400"
              )}>
                <Clock size={8} />
                <span>
                  {task.dueDate < Date.now() && task.status !== 'done'
                    ? "Overdue"
                    : `${Math.ceil((task.dueDate - Date.now()) / 86400000)}d`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-1.5 py-px rounded-full bg-slate-100/50 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                <Clock size={8} />
                <span>{Math.floor((now - task.createdAt) / 3600000)}h</span>
              </div>
            )}
            <div className={cn(
              "h-1 w-1 rounded-full",
              task.urgency >= 5 ? "bg-red-500" :
                task.urgency >= 3 ? "bg-indigo-400" : "bg-slate-300"
            )} />
          </div>

          <div className="flex -space-x-1">
            {task.tags && task.tags.length > 0 ? (
              <div className="flex gap-0.5">
                {task.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="px-1 py-px rounded bg-slate-100 text-[6px] font-bold text-slate-500 uppercase">{tag}</span>
                ))}
              </div>
            ) : (
              <div className="h-4 w-4 rounded-full ring-1 ring-white bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-[7px] font-bold text-slate-500">
                {task.title[0]}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TaskCard;
