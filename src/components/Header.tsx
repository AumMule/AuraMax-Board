import React from 'react'

type HeaderProps = {
  username: string
}

const Header = ({ username }: HeaderProps) => {
  return (
    <div className="header w-full h-20 bg-blue-100 border-b border-b-zinc-500 flex items-center justify-between px-5 py-4">
      <div className='flex text-neutral-900'>
        <div>
          <p className="tracking-tight font-mono mb-1 leading-none">
            Welcome,
          </p>
          <h2 className="font-medium bg-neutral-950 text-white rounded-md py-0.5 px-1.5 mt-0.5 text-2xl leading-none">
            {username}
          </h2>
        </div>
      </div>
    </div>
  )
}

export default Header
