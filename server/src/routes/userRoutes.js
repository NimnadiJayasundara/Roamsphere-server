import express from 'express';
import { getAllUsers, findUserByEmail } from '../controllers/userController.js';

const router = express.Router();

router.get('/users', getAllUsers);
router.get('/finduser', findUserByEmail);

export default router;