import { useState } from 'react';

type BoardHeaderProps = {
    addTask: (title: string) => void;
}

const BoardHeader = ({ addTask }: BoardHeaderProps) => {
  const [title, setTitle] = useState<string>("");

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask(title);
    setTitle("");
  };

  return (
    <div className="board-header w-full p-6 flex items-center justify-between bg-transparent">
      {/* Date Section */}
      <div className='flex flex-col'>
        <h2 className='text-2xl font-bold text-slate-800 tracking-tight'>January</h2>
        <p className='text-sm font-medium text-slate-500'>Monday, 12th 2026</p>
      </div>

      {/* Input Group */}
      <div className="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 group focus-within:shadow-md transition-all">
        <input 
          type="text" 
          placeholder="New task..." 
          value={title}
          onChange={(e) => setTitle(e.target.value)} 
          className="bg-transparent px-4 py-2 w-64 outline-none text-slate-700 placeholder:text-slate-400" 
        />
        <button 
          onClick={handleAdd} 
          className="bg-slate-900 text-white h-10 px-6 rounded-xl font-bold hover:bg-indigo-600 transition-colors active:scale-95 shadow-lg shadow-slate-200"
        >
          Add Task
        </button>
      </div>
    </div>
  )
}

export default BoardHeader