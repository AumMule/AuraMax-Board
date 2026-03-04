import Account from './Account'
import { LayoutDashboard, Settings, Zap, Target, BookOpen, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

type SidebarProps = {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
};

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Board', active: true },
    { icon: Zap, label: 'Analytics', active: false },
    { icon: Target, label: 'Goals', active: false },
    { icon: BookOpen, label: 'Docs', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ]

  return (
    <div className={cn(
      "fixed md:relative z-50 h-screen w-72 flex-col bg-slate-50/80 md:bg-white/40 backdrop-blur-xl border-r border-white/20 transition-transform duration-300 md:flex",
      isOpen ? "translate-x-0 flex" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="p-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
            <Zap size={18} className="text-white fill-current" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">NEXUS</h1>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsOpen?.(false)}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-200 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 px-4 space-y-1 mt-4">
        {menuItems.map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ x: 5 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group",
              item.active
                ? "bg-slate-800 text-white shadow-xl shadow-slate-900/10"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
            )}
          >
            <item.icon size={18} className={cn(item.active ? "text-indigo-400" : "text-slate-400 group-hover:text-indigo-500")} />
            <span className="text-sm font-bold tracking-tight">{item.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="p-6 mt-auto">
        <div className="mb-6 flex flex-col pl-2">
          <h2 className='text-lg font-black text-slate-800 tracking-tight leading-none'>
            {new Date().toLocaleString('default', { month: 'long' })} <span className="text-indigo-600">.</span>
          </h2>
          <p className='text-xs font-semibold text-slate-500/80 mt-1'>
            {new Date().toLocaleString('default', { weekday: 'long' })}, {new Date().getDate()}{['st', 'nd', 'rd'][(new Date().getDate() % 10) - 1] || 'th'} {new Date().getFullYear()}
          </p>
        </div>

        <div className="bg-slate-900 flex items-center gap-3 w-full p-3 rounded-2xl text-white shadow-2xl transition-transform hover:scale-[1.02] cursor-pointer">
          <Account />
        </div>
      </div>
    </div>
  );
};

export default Sidebar