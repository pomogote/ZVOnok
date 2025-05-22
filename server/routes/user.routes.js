import express from 'express';
import { getAllUsers } from '../controllers/user.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getAllUsers); // GET /api/users

export default router;
