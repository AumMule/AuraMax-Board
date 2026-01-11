import React from 'react';
import { useState } from 'react';

type BoardHeaderProps = {
    addTask: (title: string) => void;
}

const BoardHeader = ({ addTask }: BoardHeaderProps) => {

    const [title, setTitle] = useState<string>("");

    const handleAdd = () => {
        if (!title.trim()) return;
        addTask(title);
        setTitle("");
    };


    return (
        <div className="board-header w-full h-20 bg-blue-100 p-2 flex items-center justify-center">
            <div className="text-zinc-800 flex flex-row text-xl border-1 border-zinc-800 w-full h-full rounded-md  px-4 py-2 justify-between
            ">
                <div className='flex flex-col justify-center '>
                    <h2 className='font-bold leading-4'>Month</h2>
                    <p className='font-mono tracking-tighter'>Today is day, month date year</p>
                </div>
                <div>
                    <input type="text" placeholder="Add Task..." value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} className="px-4 py-2 rounded-md border border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600" />
                    <button onClick={handleAdd} className="bg-zinc-800 text-white px-8 py-2 rounded-md ml-4 hover:bg-zinc-600 transition">
                        +
                    </button>
                </div>
            </div>

        </div>

    )
}

export default BoardHeader