import React from 'react'
import Account from './Account'
const Sidebar = () => {
  return (
    <div className="sidebar w-80 h-full flex flex-col items-center bg-red-600 p-1 ">Sidebar
    <div className='bg-yellow-950 flex bottom-0 w-full p-2 mt-auto text-amber-50'>
        <Account />
    </div>
    </div>
  )
}

export default Sidebar