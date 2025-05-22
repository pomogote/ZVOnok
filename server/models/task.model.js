// server/models/task.model.js
const db = require('../config/db');

class Task {
  static async create({ title, description, deadline, creatorId, assigneeIds }) {
    const { rows: [task] } = await db.query(
      `INSERT INTO tasks(title, description, deadline, creator_id)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [title, description, deadline, creatorId]
    );

    if (Array.isArray(assigneeIds) && assigneeIds.length) {
      const vals = assigneeIds.map((_, i) => `($1, $${i + 2})`).join(',');
      const params = [task.id, ...assigneeIds];  
      await db.query(
        `INSERT INTO task_assignees(task_id, user_id) VALUES ${vals}`,
        params
      );
    }

    return this.findById(task.id);
  }

  static async findById(id) {
    const { rows: [task] } = await db.query(
      `SELECT * FROM tasks WHERE id = $1`, [id]
    );
    const { rows: assignees } = await db.query(
      `SELECT user_id FROM task_assignees WHERE task_id = $1`, [id]
    );
    task.assigneeIds = assignees.map(r => r.user_id);
    return task;
  }

  static async findAll(/* можно добавить фильтр по creatorId */) {
    const { rows } = await db.query(`SELECT * FROM tasks ORDER BY created_at DESC`);
    // Для каждого получить assigneeIds — можно оптимизировать через JOIN
    for (let task of rows) {
      const { rows: asg } = await db.query(
        `SELECT user_id FROM task_assignees WHERE task_id = $1`, [task.id]
      );
      task.assigneeIds = asg.map(r => r.user_id);
    }
    return rows;
  }

  static async updateStatus(id, status) {
    const { rows: [task] } = await db.query(
      `UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *`, [status, id]
    );
    return this.findById(task.id);
  }
}

module.exports = Task;
