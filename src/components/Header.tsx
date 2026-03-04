import { Bell, Search, Command, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

type HeaderProps = {
  username: string;
  onMenuClick?: () => void;
}

const Header = ({ username, onMenuClick }: HeaderProps) => {
  return (
    <div className="w-full h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 flex-shrink-0">
      {/* Left */}
      <div className='flex items-center gap-3'>
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300 transition-all"
        >
          <Menu size={18} />
        </button>

        <div className="hidden md:flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] px-3 py-2 rounded-xl text-zinc-600 group cursor-pointer hover:bg-white/[0.05] hover:border-white/10 transition-all">
          <Search size={13} />
          <span className="text-[12px] font-medium text-zinc-600">Search tasks...</span>
          <div className="flex items-center gap-0.5 bg-white/[0.04] px-1.5 py-0.5 rounded-md border border-white/[0.06] ml-2">
            <Command size={9} className="text-zinc-700" />
            <span className="text-[9px] font-bold text-zinc-700">K</span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-3">
        <button className="md:hidden p-2 rounded-xl text-zinc-600 hover:bg-white/[0.04] transition-all">
          <Search size={17} />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
          <span className="text-[11px] font-semibold text-zinc-400">{username}</span>
        </div>

        <motion.button
          whileHover={{ rotate: 15 }}
          className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-500 hover:text-orange-400 hover:border-orange-500/20 transition-all"
        >
          <Bell size={15} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
        </motion.button>

        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center text-white font-black text-[11px] shadow-lg shadow-orange-900/30 border border-white/10">
          {username.substring(0, 1).toUpperCase()}
        </div>
      </div>
    </div>
  )
}

export default Header
