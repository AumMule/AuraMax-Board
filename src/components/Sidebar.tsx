import Account from './Account'
import { LayoutDashboard, Zap, CalendarDays, BookOpen, X, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

type SidebarProps = {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const Sidebar = ({ isOpen, setIsOpen, activeTab, setActiveTab }: SidebarProps) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Board' },
    { icon: Zap, label: 'Analytics' },
    { icon: CalendarDays, label: 'Goals' },
    { icon: BookOpen, label: 'Docs' },
    { icon: Clock, label: 'Timer' },
  ]

  return (
    <div className={cn(
      "fixed md:relative z-50 h-screen w-64 flex-col bg-[#0f0f0f] border-r border-white/[0.06] transition-transform duration-300 md:flex",
      isOpen ? "translate-x-0 flex" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Logo */}
      <div className="px-5 pt-7 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-900/40">
            <Zap size={16} className="text-white fill-current" />
          </div>
          <h1 className="text-[15px] font-black text-white tracking-tight">NEXUS</h1>
        </div>
        <button
          onClick={() => setIsOpen?.(false)}
          className="md:hidden p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded-lg hover:bg-white/5"
        >
          <X size={18} />
        </button>
      </div>

      {/* Date display */}
      <div className="px-5 pb-5">
        <p className="text-[11px] font-semibold text-zinc-600 leading-relaxed">
          {new Date().toLocaleString('default', { weekday: 'long' })}&nbsp;
          <span className="text-orange-500/80 font-bold">
            {new Date().getDate()}{['st', 'nd', 'rd'][(new Date().getDate() % 10) - 1] || 'th'}
          </span>
          ,&nbsp;{new Date().toLocaleString('default', { month: 'long' })}
        </p>
      </div>

      {/* Nav label */}
      <div className="px-5 mb-2">
        <span className="text-[9px] font-black tracking-[0.2em] text-zinc-700 uppercase">Navigation</span>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-3 space-y-0.5">
        {menuItems.map((item) => {
          const isActive = item.label === activeTab;
          return (
            <motion.button
              key={item.label}
              whileHover={{ x: isActive ? 0 : 3 }}
              onClick={() => {
                setActiveTab(item.label);
                setIsOpen?.(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group text-left",
                isActive
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-7 h-7 rounded-lg transition-all",
                isActive ? "bg-orange-500/20" : "bg-transparent group-hover:bg-white/[0.04]"
              )}>
                <item.icon size={15} className={cn(
                  "transition-colors",
                  isActive ? "text-orange-400" : "text-zinc-600 group-hover:text-zinc-300"
                )} />
              </div>
              <span className={cn(
                "text-[13px] font-semibold tracking-tight",
                isActive ? "text-orange-300" : ""
              )}>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-4 bg-orange-500 rounded-full" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Account section */}
      <div className="p-4 border-t border-white/[0.05]">
        <div className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] flex items-center gap-3 w-full p-3 rounded-2xl text-white transition-all duration-200 cursor-pointer">
          <Account />
        </div>
      </div>
    </div>
  );
};

export default Sidebar