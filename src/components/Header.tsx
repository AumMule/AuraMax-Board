import { Bell, Search, Command, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

type HeaderProps = {
  username: string;
  onMenuClick?: () => void;
}

const Header = ({ username, onMenuClick }: HeaderProps) => {
  return (
    <div className="w-full h-20 bg-white/10 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      <div className='flex items-center gap-4 md:gap-6'>
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-white/50 transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-slate-500">
          <p className="text-xs font-bold tracking-widest uppercase">Member</p>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="text-sm font-bold text-slate-800">{username}</span>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-white/40 border border-white/20 px-3 py-1.5 rounded-lg text-slate-400 group cursor-pointer hover:bg-white/60 transition-all">
          <Search size={14} />
          <span className="text-xs font-semibold">Search Nexus...</span>
          <div className="flex items-center gap-0.5 bg-slate-100 px-1 rounded border border-slate-200">
            <Command size={10} />
            <span className="text-[10px] font-bold">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile Search Icon (optional, just an icon) */}
        <button className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-white/50 transition-colors">
          <Search size={18} />
        </button>

        <motion.button
          whileHover={{ rotate: 15 }}
          className="relative h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-xl bg-white/60 border border-white/20 text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </motion.button>

        <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs">
          {username.substring(0, 1).toUpperCase()}
        </div>
      </div>
    </div>
  )
}

export default Header
