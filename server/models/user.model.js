const pool = require('../config/db');
class User {
  static async findByEmail(email) {
    try {
      console.log(`[DB] Поиск пользователя по email: ${email}`);
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return rows[0];
    } catch (error) {
      console.error(`[DB] Ошибка поиска пользователя: ${error.message}`);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return rows[0];
    } catch (error) {
      console.error(`[DB] Ошибка поиска пользователя: ${error.message}`);
      throw error;
    }
  }

  static async createUser(name, email, passwordHash) {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [name, email, passwordHash]
    );
    return rows[0];
  }
}
module.exports = User;