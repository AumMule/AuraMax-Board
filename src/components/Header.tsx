type HeaderProps = {
  username: string
}

const Header = ({ username }: HeaderProps) => {
  return (
    <div className="header w-full h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 py-4 sticky top-0 z-10">
      <div className='flex items-center gap-2'>
        <p className="tracking-tight text-slate-500 font-medium">
          Welcome back,
        </p>
        {/* A more aesthetic tag for the username */}
        <span className="bg-indigo-50 text-indigo-700 font-bold py-1 px-3 rounded-lg border border-indigo-100 text-lg">
          {username}
        </span>
      </div>
      
      {/* Optional: Add a search bar or notification icon here later */}
      <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white shadow-sm"></div>
    </div>
  )
}

export default Header
