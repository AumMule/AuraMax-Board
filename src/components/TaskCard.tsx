import { useDraggable } from "@dnd-kit/core";

type Task = {
  id: string | number;
  title: string;
};

const TaskCard = ({ task, deleteTask }: { task: Task; deleteTask: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  // Apply transform style so the card moves with the mouse
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="
        bg-white p-4 mb-3 rounded-xl
        border border-slate-200 
        shadow-sm hover:shadow-md 
        transition-shadow cursor-grab active:cursor-grabbing
        group relative
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Aesthetic vertical accent line */}
          <div className="w-1 h-6 bg-blue-400 rounded-full" />
          <span className="text-slate-700 font-medium">{task.title}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id.toString());
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="
            opacity-0 group-hover:opacity-100 
            transition-opacity p-1.5 
            hover:bg-red-50 hover:text-red-500 
            text-slate-400 rounded-lg
            cursor-pointer
          "
          title="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
