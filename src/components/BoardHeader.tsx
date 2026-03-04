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

  return (
    <div className="w-full px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Search Input Container */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center bg-white/40 backdrop-blur-md p-1 rounded-xl group focus-within:ring-2 ring-indigo-500/20 transition-all w-full md:w-auto"
      >
        <input
          type="text"
          placeholder="Summon a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="bg-transparent px-3 py-1.5 flex-1 md:w-64 outline-none text-slate-700 placeholder:text-slate-400 text-xs font-medium"
        />
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white h-8 px-5 rounded-lg text-[10px] font-bold hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-900/10 flex-shrink-0"
        >
          <Sparkles size={12} className="animate-pulse" />
          Create
        </button>
      </motion.div>
    </div>
  )
}

export default BoardHeader