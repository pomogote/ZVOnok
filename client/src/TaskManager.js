import React, { useState, useEffect } from 'react';
import { fetchUsers, fetchTasks, createTask, updateTask } from './api';

export default function TaskManager({ token, userId }) {
    const [users, setUsers] = useState([]);
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    function normalizeList(response) {
        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response.tasks)) return response.tasks;
        if (response && Array.isArray(response.data)) return response.data;
        return [];
    }

    function normalizeItem(response) {
        if (!response) return null;
        if (response.task) return response.task;
        if (response.data) return response.data;
        return response;
    }

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
        if (token) {
            fetchUsers(token).then(setUsers);
            loadTasks();
        }
    }, [token]);

    const handleAssigneeToggle = id => {
        setSelectedAssignees(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    async function handleCreate(e) {
        e.preventDefault();
        setError(null);
        try {
            const payload = {
                title,
                description,
                deadline,
                assigneeIds: selectedAssignees
            };
            const result = await createTask(payload, token);
            const newTask = normalizeItem(result);
            if (newTask) setTasks(prev => [newTask, ...prev]);
            setTitle('');
            setDescription('');
            setDeadline('');
            setSelectedAssignees([]);
        } catch (err) {
            console.error(err);
            setError('Ошибка при создании задачи');
        }
    }

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
                <div>
                    <p className="font-medium">Исполнители:</p>
                    {users.map(u => (
                        <label key={u.id} className="block">
                            <input
                                type="checkbox"
                                checked={selectedAssignees.includes(u.id)}
                                onChange={() => handleAssigneeToggle(u.id)}
                            />{' '}
                            {u.name || u.email || u.username || `User ${u.id}`}
                        </label>
                    ))}
                </div>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Создать задачу
                </button>
            </form>

            {loading && <p>Загрузка...</p>}
            {!loading && !tasks.length && <p>Задач нет.</p>}

            {!loading && tasks.length > 0 && (
                <div className="space-y-3">
                    {tasks.map((task, idx) => (
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
                                    Назначено: {task.assigneeIds?.map(id => {
                                        const user = users.find(u => u.id === id);
                                        return user?.name || `User ${id}`;
                                    }).join(', ') || '—'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleStatus(task)}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                                {task.status === 'done' ? 'Возврат в TODO' : 'След. статус'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
