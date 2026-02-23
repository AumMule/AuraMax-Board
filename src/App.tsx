import { useEffect, useState } from 'react'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Board from './components/Board'

import CustomCursor from './components/CustomCursor';



const App = () => {
  const [username, setUsername] = useState("User");

  useEffect(() => {
    const storedname = localStorage.getItem("username");
    if (storedname) setUsername(storedname);
  }, []);
  
  return (
    // Fixed: h-screen and overflow-hidden prevent the whole page from scrolling
    <div className="flex w-screen h-screen bg-slate-50 font-sans overflow-hidden">
      <CustomCursor />
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header username={username} />

        {/* Board Container: flex-1 makes it take up all remaining height */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <Board />
        </main>
      </div>

    </div>
  );
};

export default App