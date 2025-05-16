const pool = require("../config/db");

class Room {
  static async create(name, type = "chat") {
    const { rows } = await pool.query(
      "INSERT INTO rooms (name, type) VALUES ($1, $2) RETURNING *",
      [name, type]
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
}

module.exports = Room;