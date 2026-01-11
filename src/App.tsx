import React, { useEffect, useState } from 'react'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Board from './components/Board'




const App = () => {

  const [username, setUsername] = useState("User");

  useEffect(() => {
    const storedname = localStorage.getItem("username");
    if (storedname) {
      setUsername(storedname);
    }
  }, []);


  return (
    <div className="flex w-screen h-screen bg-gray-200 font-mono">
      <div>
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-h-0">
        <div>
          <Header username={username} />
        </div>
        
        <div className="flex w-full h-full">
          <Board />
        </div>

      </div>



    </div>
  )
}

export default App