const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, roomController.createRoom);
router.get("/:roomId", authMiddleware, roomController.getRoom);
router.get("/", authMiddleware, roomController.getAllRooms);
router.delete("/:roomId", authMiddleware, roomController.deleteRoom);

module.exports = router;