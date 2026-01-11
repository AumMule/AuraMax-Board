import React from 'react'

type Task = {
  id: string | number;
  title: string;
  status: string;
}

type ColumnProps = {
  columnTitle: string;
  tasks: Task[];
}

const Column = ({ columnTitle, tasks }: ColumnProps) => {
  return (
    <div className="column flex flex-col h-full bg-gray-300 p-2">
      <div className="column-header font-bold mb-2">{columnTitle}</div>
      <div className="tasks">
        {tasks.map((t: any) => (
          <div key={t.id} className="task bg-white p-2 mb-2 rounded shadow">
            {t.title}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Column