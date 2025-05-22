// server/controllers/task.controller.js
import Task from '../models/task.model.js';

export const createTask = async (req, res) => {
  const { title, description, deadline, assigneeIds } = req.body;
  const creatorId = req.user.id;
  const task = await Task.create({ title, description, deadline, creatorId, assigneeIds });
  res.status(201).json(task);
};

export const getTasks = async (req, res) => {
  const tasks = await Task.findAll(/* можно фильтровать по creatorId или по assigneeIds */);
  res.json(tasks);
};

export const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const task = await Task.updateStatus(taskId, status);
  res.json(task);
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