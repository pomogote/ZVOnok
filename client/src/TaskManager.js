import React, { useState, useEffect } from 'react';
import { fetchTasks, createTask, updateTask } from './api';

export default function TaskManager({ token, userId }) {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Универсальная функция для обработки ответа от API
    function normalizeList(response) {
        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response.tasks)) return response.tasks;
        if (response && Array.isArray(response.data)) return response.data;
        return [];
    }

    // Универсальная функция для извлечения объекта задачи
    function normalizeItem(response) {
        if (!response) return null;
        if (response.task) return response.task;
        if (response.data) return response.data;
        return response;
    }

    // Загрузка задач
    async function loadTasks() {
        setLoading(true);
        try {
            const result = await fetchTasks(token);
            const list = normalizeList(result);
            setTasks(list);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Не удалось загрузить задачи');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (token) loadTasks();
    }, [token]);

    // Создание задачи
    async function handleCreate(e) {
        e.preventDefault();
        setError(null);
        try {
            const payload = { title, description, deadline, assignee_id: userId };
            const result = await createTask(payload, token);
            const newTask = normalizeItem(result);
            if (newTask) setTasks(prev => [newTask, ...prev]);
            setTitle('');
            setDescription('');
            setDeadline('');
        } catch (err) {
            console.error(err);
            setError('Ошибка при создании задачи');
        }
    }

    // Обновление статуса задачи
    async function handleStatus(task) {
        const next = { todo: 'in_progress', in_progress: 'done', done: 'todo' }[task.status];
        try {
            const result = await updateTask(task.id, next, token);
            const updated = normalizeItem(result);
            if (updated)
                setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        } catch (err) {
            console.error(err);
            setError('Не удалось обновить статус');
        }
    }

    return (
        <div className="p-4 space-y-4 max-w-lg mx-auto">
            <button onClick={loadTasks} className="text-sm text-blue-600 hover:underline">
                Обновить задачи
            </button>

            <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow space-y-3">
                {error && <p className="text-red-600">{error}</p>}
                <input
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Заголовок"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                />
                <textarea
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Описание"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                />
                <input
                    type="date"
                    className="w-full border px-3 py-2 rounded"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    required
                />
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Создать задачу
                </button>
            </form>

            {loading && <p>Загрузка...</p>}
            {!loading && !tasks.length && <p>Задач нет.</p>}

            {!loading && tasks.length > 0 && (
                <div className="space-y-3">
                    {tasks.map((task, idx) =>
                        task ? (
                            <div
                                key={task.id || idx}
                                className="bg-white p-4 rounded shadow flex justify-between items-center"
                            >
                                <div>
                                    <h3 className="font-semibold">{task.title}</h3>
                                    <p className="text-sm">{task.description}</p>
                                    <p className="text-xs text-gray-500">
                                        Дедлайн: {new Date(task.deadline).toLocaleDateString()}
                                    </p>
                                    <p className="uppercase text-xs mt-1">Статус: {task.status}</p>
                                    <p className="text-xs text-gray-600">
                                        Назначено: {task.assignee_id === userId ? 'Вам' : task.assignee_id}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleStatus(task)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                >
                                    {task.status === 'done' ? 'Возврат в TODO' : 'След. статус'}
                                </button>
                            </div>
                        ) : null
                    )}
                </div>
            )}
        </div>
    );
}