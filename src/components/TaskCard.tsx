import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Trash2, GripVertical, Clock } from "lucide-react";
import { cn } from "../lib/utils";

type Task = {
  id: string | number;
  title: string;
  priority?: 'low' | 'medium' | 'high';
};

const TaskCard = ({ task, deleteTask }: { task: Task; deleteTask: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  // dnd-kit handles the transform, but we only apply it if it's NOT being rendered in a DragOverlay
  // Actually, dnd-kit recommends NOT setting transform on the original element if using DragOverlay
  // to avoid duplication, but we need the element to stay in place (placeholder).
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0 : 1, // Hide original when dragging (DragOverlay shows the actual card)
  } : undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={!isDragging ? { scale: 1.02, y: -2 } : {}}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl p-4 transition-all duration-200",
        "glass border border-white/40 shadow-sm",
        !isDragging && "hover:shadow-xl hover:border-indigo-200/50 hover:bg-white/80",
        isDragging ? "opacity-0 cursor-grabbing" : "cursor-grab"
      )}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors">
            <GripVertical size={14} />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-700 leading-snug">
            {task.title}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id.toString());
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Clock size={10} />
            <span>2h</span>
          </div>
          <div className={cn(
            "h-1.5 w-1.5 rounded-full",
            task.priority === 'high' ? "bg-red-500 animate-pulse" :
              task.priority === 'medium' ? "bg-amber-400" : "bg-emerald-400"
          )} />
        </div>

        <div className="flex -space-x-1.5">
          <div className="h-5 w-5 rounded-full ring-2 ring-white bg-gradient-to-tr from-indigo-500 to-purple-500" />
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
