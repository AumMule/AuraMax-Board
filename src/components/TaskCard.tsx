import { useDraggable } from "@dnd-kit/core";

type Task = {
  id: string | number;
  title: string;
};

const TaskCard = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  // Apply transform style so the card moves with the mouse
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
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
        group
      "
    >
      <div className="flex items-center gap-3">
        {/* Aesthetic vertical accent line */}
        <div className="w-1 h-6 bg-blue-400 rounded-full" />
        <span className="text-slate-700 font-medium">{task.title}</span>
      </div>
    </div>
  );
};

export default TaskCard;
