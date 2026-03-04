import { useEffect, useState } from 'react'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Board from './components/Board'
import Goals from './components/Goals'

import CustomCursor from './components/CustomCursor';

const App = () => {
  const [username, setUsername] = useState("User");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Board");

  useEffect(() => {
    const storedname = localStorage.getItem("username");
    if (storedname) setUsername(storedname);
  }, []);

  return (
    // Fixed: h-screen and overflow-hidden prevent the whole page from scrolling
    <div className="flex w-screen h-screen bg-slate-50 font-sans overflow-hidden">
      <CustomCursor />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header username={username} onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Board Container: flex-1 makes it take up all remaining height */}
        <main className="flex-1 min-h-0 overflow-hidden relative">
          {activeTab === "Board" && <Board />}
          {activeTab === "Goals" && <Goals />}
        </main>
      </div>

    </div>
  );
};

export default App