const Room = require("../models/room.model");

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.getAll();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const room = await Room.create(name, req.userId); // Передаём ID создателя
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: "Ошибка создания комнаты" });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Комната не найдена" });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения комнаты" });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Проверка прав владельца
    const isOwner = await Room.isOwner(roomId, req.userId);
    if (!isOwner) {
      return res.status(403).json({ error: "Только создатель может удалить комнату" });
    }

    const success = await Room.delete(roomId);
    if (!success) {
      return res.status(404).json({ error: "Комната не найдена" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Ошибка удаления комнаты" });
  }
};