import { useState } from 'react';
import { Sparkles } from 'lucide-react';
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
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-1 rounded-2xl group focus-within:ring-1 focus-within:ring-orange-500/30 focus-within:border-orange-500/20 transition-all w-full md:w-auto shadow-xl shadow-black/20"
    >
      <input
        type="text"
        placeholder="Add a new task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        className="bg-transparent px-4 py-2 flex-1 md:w-64 xl:w-72 outline-none text-zinc-300 placeholder:text-zinc-700 text-sm font-medium"
      />
      <button
        onClick={handleAdd}
        className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white h-9 px-5 rounded-xl text-[11px] font-bold tracking-wide transition-all active:scale-95 shadow-lg shadow-orange-900/40 flex-shrink-0"
      >
        <Sparkles size={13} />
        Create
      </button>
    </motion.div>
  )
}

export default BoardHeader