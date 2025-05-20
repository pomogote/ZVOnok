const pool = require('../config/db');

class Message {
  static async create(text, senderId, roomId, isVoiceMessage = false, fileUrl = null) {
    try {
      if (isVoiceMessage) text = "";
      const { rows } = await pool.query(
        `INSERT INTO messages (text, sender_id, room_id, is_voice_message, file_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [text, senderId, roomId, isVoiceMessage, fileUrl]
      );
      console.log('[DB] Сообщение сохранено:', rows[0]); // Логирование
      return rows[0];
    } catch (error) {
      console.error('[DB] Ошибка сохранения:', error);
      throw error;
    }
  }

  static async findByRoom(roomId) {
    const { rows } = await pool.query(
      `SELECT 
      m.id,
      m.text,
      m.sender_id,
      m.room_id,
      m.is_voice_message,
      m.file_url,
      m.created_at,
      u.name as user_name
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.room_id = $1
    ORDER BY m.created_at ASC`,
      [roomId]
    );
    return rows;
  }

  static async delete(messageId) {
    const { rowCount } = await pool.query(
      "DELETE FROM messages WHERE id = $1",
      [messageId]
    );
    return rowCount > 0;
  }

  static async findById(messageId) {
    const { rows } = await pool.query(
      "SELECT * FROM messages WHERE id = $1",
      [messageId]
    );
    return rows[0];
  }

}

module.exports = Message;