const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Логирование входящего запроса
    console.log(`[REGISTER] Попытка регистрации: ${email}`);

     // Проверка существующего пользователя
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.warn(`[REGISTER] Email уже занят: ${email}`);
      return res.status(400).json({ error: "Email уже занят" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await User.createUser(name, email, hashedPassword);

    //GOVNO
    const token = jwt.sign({ userId: user.id }, 'your_jwt_secret', { expiresIn: '10h' });
    
    console.log(`[REGISTER] Успешно: ID ${user.id}`);
    console.log('[LOGIN] Generated token:', token);

    res.status(201).json(user);
  } catch (error) {
    // Логирование ошибки с деталями
    console.error('[REGISTER] Ошибка:', error.stack);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user.id }, 'your_jwt_secret', { expiresIn: '10h' }); // ВРЕМЯ СЕССИ МОЖНО ПОМЕНЯТЬ ЕС ЧО
  res.json({ token });
};