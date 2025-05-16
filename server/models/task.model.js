const pool = require('../config/db');
class Task {
  static async create(title, description, assigneeId, deadline) {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, assignee_id, deadline)
       VALUES ($1, $2, 'todo', $3, $4) RETURNING *`,
      [title, description, assigneeId, deadline]
    );
    return rows[0];
  }

  static async findAllByUser(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM tasks WHERE assignee_id = $1`,
      [userId]
    );
    return rows;
  }

  static async updateStatus(taskId, newStatus) {
    const { rows } = await pool.query(
      `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *`,
      [newStatus, taskId]
    );
    return rows[0];
  }
}

module.exports = Task;