import Account from './Account'
const Sidebar = () => {
  return (
    <div className="sidebar w-72 h-full flex flex-col bg-slate-100 border-r border-slate-200">
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Project Space</h1>
      </div>

      {/* Middle Content */}
      <div className="flex-1 px-4">
        <nav className="space-y-1">
          <div className="bg-white shadow-sm text-blue-600 p-3 rounded-lg font-medium cursor-pointer">
            Kanban Board
          </div>
          <div className="text-slate-500 hover:bg-slate-200 p-3 rounded-lg cursor-pointer transition-colors">
            Settings
          </div>
        </nav>
      </div>

      {/* Account Section - Sticky at bottom */}
      <div className="p-4 mt-auto">
        <div className="bg-slate-800 flex items-center gap-3 w-full p-3 rounded-2xl text-white shadow-lg shadow-slate-900/20">
          <Account />
        </div>
      </div>
    </div>
  );
};

export default Sidebar