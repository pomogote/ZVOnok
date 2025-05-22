// server/controllers/task.controller.js
import Task from '../models/task.model.js';

exports.createTask = async (req, res) => {
  try {
    const { title, description, deadline, assigneeIds } = req.body;
    const creatorId = req.userId;        // или req.user.id, как вы устанавливали в auth
    const task = await Task.create({ title, description, deadline, creatorId, assigneeIds });
    res.status(201).json(task);
  } catch (err) {
    console.error('Ошибка при создании задачи', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll();
    res.json(tasks);
  } catch (err) {
    console.error('Ошибка при получении задач', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const task = await Task.updateStatus(taskId, status);
    res.json(task);
  } catch (err) {
    console.error('Ошибка при обновлении задачи', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};




// const Task = require('../models/task.model');

// exports.createTask = async (req, res) => {
//   try {
//     const { title, description, deadline } = req.body;
//     const task = await Task.create(title, description, req.userId, deadline);
//     res.status(201).json(task);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to create task' });
//   }
// };

// exports.getTasks = async (req, res) => {
//   try {
//     const tasks = await Task.findAllByUser(req.userId);
//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch tasks' });
//   }
// };

// exports.updateTask = async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const { status } = req.body;
//     const task = await Task.updateStatus(taskId, status);
//     res.json(task);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to update task' });
//   }
// };