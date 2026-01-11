import React, { useState } from 'react'
import BoardHeader from './BoardHeader'
import Column from './Column'
const Board = () => {


    const [tasks, setTasks] = useState([
        { id: "1", title: "Learn React", status: "todo" },
        { id: "2", title: "Build Kanban UI", status: "doing" },
        { id: "3", title: "Push to GitHub", status: "done" },
    ]);

    const columnTitle = [{name:"To Do", status:"todo"}, {name:"Doing", status:"doing"}, {name:"Done", status:"done"}];
    
    const addTask = (title: string) => {
        const newTask = { id: Date.now().toString(), title, status: "todo" };
        setTasks([...tasks, newTask]);
    }

    return (
        <div className="board w-full h-full bg-gray-100">
            <BoardHeader addTask={addTask} />
            <div className="p-4 bg-amber-300 h-[calc(100vh-10rem)] w-full flex gap-4 overflow-x-auto">
                <div className='flex-1' >
                    <Column columnTitle={columnTitle[0].name} tasks={tasks.filter(task => task.status === "todo")} />
                </div>
                <div className='flex-1'>
                    <Column columnTitle={columnTitle[1].name} tasks={tasks.filter(task => task.status === "doing")} />
                </div>
                <div className='flex-1'>
                    <Column columnTitle={columnTitle[2].name} tasks={tasks.filter(task => task.status === "done")} />
                </div>

            </div>
        </div>
    )
}

export default Board