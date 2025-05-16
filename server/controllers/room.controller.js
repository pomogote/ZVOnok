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
    const room = await Room.create(name);
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