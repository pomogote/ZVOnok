// src/pages/TasksPage.jsx
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import TaskCard from '../components/TaskCard';
import { fetchTasks, createTask, updateTask, deleteTask } from '../utils/api';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchTasks().then(setTasks);
  }, []);

  const handleCreate = async () => {
    const created = await createTask({ title: newTitle });
    setTasks(prev => [...prev, created]);
    setNewTitle('');
  };

  const handleUpdate = async (id) => {
    const updated = await updateTask(id, { status: 'done' });
    setTasks(tasks.map(t => t.id === id ? updated : t));
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-auto">
        <div className="col-span-full flex mb-4">
          <input
            className="flex-1 px-3 py-2 bg-surface text-text rounded-l-lg focus:outline-none"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Новая задача..."
          />
          <button onClick={handleCreate} className="px-4 bg-primary rounded-r-lg">Добавить</button>
        </div>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default TasksPage;
