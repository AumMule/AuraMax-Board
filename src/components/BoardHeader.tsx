import { useState } from 'react';
import { Sparkles, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' });
  const day = today.getDate();
  const weekday = today.toLocaleString('default', { weekday: 'long' });

  return (
    <div className="w-full px-8 py-3 flex items-center justify-between">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className='flex items-center gap-4'
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <Calendar size={12} className="text-indigo-500" />
            <p className='text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400'>Workspace Sync</p>
          </div>
          <h2 className='text-xl font-black text-slate-800 tracking-tight leading-none'>
            {month} <span className="text-indigo-600">.</span>
          </h2>
          <p className='text-[10px] font-semibold text-slate-500/80 mt-0.5'>{weekday}, {day}th {today.getFullYear()}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center glass p-1 rounded-xl group focus-within:ring-2 ring-indigo-500/20 transition-all"
      >
        <input
          type="text"
          placeholder="Summon a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="bg-transparent px-3 py-1.5 w-64 outline-none text-slate-700 placeholder:text-slate-400 text-xs font-medium"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-slate-900 text-white h-8 px-5 rounded-lg text-[10px] font-bold hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
        >
          <Sparkles size={12} className="animate-pulse" />
          Create
        </button>
      </motion.div>
    </div>
  )
}

export default BoardHeader