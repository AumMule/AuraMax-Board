import TaskCard from './TaskCard';
import { useDroppable } from "@dnd-kit/core";


type Task = {
  id: string | number;
  title: string;
  status: string;
}

type ColumnProps = {
  columnTitle: string;
  status: string;
  tasks: Task[];
}


const Column = ({ columnTitle, tasks, status }: ColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className="
        column flex flex-col h-full 
        /* Clean white background */
        bg-white/90 
        /* Large, soft floating shadow with a hint of blue-gray */
        shadow-[0_8px_30px_rgb(0,0,0,0.04)] 
        /* Subtle border to define the shape against the off-white BG */
        border border-slate-200/60 
        rounded-[24px] 
        p-5
      "
    >
      {/* Header with better typography */}
      <div className="column-header flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700 tracking-tight px-1">
          {columnTitle}
        </h3>
        <span className="bg-slate-100 text-slate-500 text-xs py-1 px-2.5 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>

      <div className="tasks space-y-3">
        {tasks.map((t: any) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  )
}

export default Column