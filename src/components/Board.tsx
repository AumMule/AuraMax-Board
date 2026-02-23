import { useState } from 'react'
import BoardHeader from './BoardHeader'
import Column from './Column'

import { DndContext } from "@dnd-kit/core";


const Board = () => {


    const [tasks, setTasks] = useState([
        { id: "1", title: "Learn React", status: "todo" },
        { id: "2", title: "Build Kanban UI", status: "doing" },
        { id: "3", title: "Push to GitHub", status: "done" },
    ]);

    const columnTitle = [{ name: "To Do", status: "todo" }, { name: "Doing", status: "doing" }, { name: "Done", status: "done" }];

    const addTask = (title: string) => {
        const newTask = { id: Date.now().toString(), title, status: "todo" };
        setTasks([...tasks, newTask]);
    }

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (!over) return;

        const taskId = active.id;
        const newStatus = over.id;

        setTasks((prevTasks) =>
            prevTasks.map((task) =>
                task.id === taskId
                    ? { ...task, status: newStatus }
                    : task
            )
        );
    };

    return (

        <DndContext onDragEnd={handleDragEnd}>
            {/* Change bg-gray-100 to bg-slate-50 for a cleaner off-white base */}
            <div className="board w-full h-full bg-slate-50">
                <BoardHeader addTask={addTask} />

                {/* Softened the background here from blue-100 to a more subtle slate or transparent blue */}
                <div className="p-8 h-[calc(100vh-10rem)] w-full flex gap-6 overflow-x-auto">
                    {columnTitle.map((col) => (
                        <div key={col.status} className='flex-1 min-w-[300px]'>
                            <Column
                                columnTitle={col.name}
                                status={col.status}
                                tasks={tasks.filter(task => task.status === col.status)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </DndContext>
    )
}

export default Board