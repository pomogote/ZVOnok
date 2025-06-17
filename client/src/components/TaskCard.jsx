// src/components/TaskCard.jsx
import React from 'react';

const TaskCard = ({ task, onUpdate, onDelete }) => (
  <div className="bg-surface p-4 rounded-lg shadow-sm">
    <h3 className="text-lg font-medium mb-2">{task.title}</h3>
    <p className="text-sm text-muted mb-4">{task.status}</p>
    <div className="flex space-x-2">
      <button onClick={() => onUpdate(task.id)} className="px-3 py-1 bg-primary rounded-lg text-white">Изменить</button>
      <button onClick={() => onDelete(task.id)} className="px-3 py-1 bg-secondary rounded-lg text-text">Удалить</button>
    </div>
  </div>
);

export default TaskCard;