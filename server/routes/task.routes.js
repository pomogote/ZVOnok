const express = require('express');
// вытащим нужные функции из контроллера
const {
    getTasks,
    createTask,
    updateTask
} = require('../controllers/task.controller');

// приведём middleware к тому названию, которое будем использовать
const auth = require('../middleware/auth');

const router = express.Router();

// теперь всё совпадает
router.get('/', auth, getTasks);
router.post('/', auth, createTask);
router.patch('/:taskId', auth, updateTask);

module.exports = router;