const pool = require("../config/db");

class Room {
  static async create(name, creatorId) {
    const { rows } = await pool.query(
      "INSERT INTO rooms (name, creator_id) VALUES ($1, $2) RETURNING *",
      [name, creatorId]
    );
    return rows[0];
  }

  static async getAll() {
    const { rows } = await pool.query("SELECT * FROM rooms ORDER BY id ASC");
    return rows;
  }

  static async findById(roomId) {
    const { rows } = await pool.query("SELECT * FROM rooms WHERE id = $1", [roomId]);
    return rows[0];
  }

  static async delete(roomId) {
    const { rowCount } = await pool.query(
      "DELETE FROM rooms WHERE id = $1 RETURNING *",
      [roomId]
    );
    return rowCount > 0;
  }

  static async isOwner(roomId, userId) {
    const { rows } = await pool.query(
      "SELECT creator_id FROM rooms WHERE id = $1",
      [roomId]
    );
    return rows[0]?.creator_id === userId;
  }
}

module.exports = Room;