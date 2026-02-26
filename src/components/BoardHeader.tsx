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
    <div className="w-full px-8 py-4 flex items-center justify-between">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className='flex flex-col'
      >
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={14} className="text-indigo-500" />
          <p className='text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400'>Workspace Sync</p>
        </div>
        <h2 className='text-3xl font-black text-slate-800 tracking-tight'>
          {month} <span className="text-indigo-600">.</span>
        </h2>
        <p className='text-xs font-semibold text-slate-500/80'>{weekday}, {day}th {today.getFullYear()}</p>
      </motion.div>

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center glass p-1.5 rounded-2xl group focus-within:ring-2 ring-indigo-500/20 transition-all"
      >
        <input
          type="text"
          placeholder="Summon a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="bg-transparent px-4 py-2 w-72 outline-none text-slate-700 placeholder:text-slate-400 text-sm font-medium"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-slate-900 text-white h-10 px-6 rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
        >
          <Sparkles size={14} className="animate-pulse" />
          Create
        </button>
      </motion.div>
    </div>
  )
}

export default BoardHeader