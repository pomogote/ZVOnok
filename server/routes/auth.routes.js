const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        // Получаем полные данные пользователя из БД
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Отправляем данные пользователя
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;