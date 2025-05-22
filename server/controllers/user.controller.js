import db from '../db.js';

export const getAllUsers = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, email FROM users ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при получении пользователей', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
