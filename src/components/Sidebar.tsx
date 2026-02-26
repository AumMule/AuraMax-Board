import Account from './Account'
import { LayoutDashboard, Settings, Zap, Target, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Board', active: true },
    { icon: Zap, label: 'Analytics', active: false },
    { icon: Target, label: 'Goals', active: false },
    { icon: BookOpen, label: 'Docs', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ]

  return (
    <div className="sidebar w-72 h-screen flex flex-col bg-white/40 backdrop-blur-xl border-r border-white/20 z-20">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
            <Zap size={18} className="text-white fill-current" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">NEXUS</h1>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-1">
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
        <div className="bg-slate-900 flex items-center gap-3 w-full p-3 rounded-2xl text-white shadow-2xl transition-transform hover:scale-[1.02] cursor-pointer">
          <Account />
        </div>
      </div>
    </div>
  );
};

export default Sidebar