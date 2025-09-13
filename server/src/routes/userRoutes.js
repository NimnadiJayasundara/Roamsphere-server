import express from 'express';
import { getAllUsers, findUserByEmail, getDriverProfileByEmail, addDriver, updateDriver } from '../controllers/userController.js';

const router = express.Router();

router.get('/users', getAllUsers);
router.get('/finduser', findUserByEmail);
router.post('/add', addDriver);
router.put('/update', updateDriver);
router.get('/profile', getDriverProfileByEmail);

export default router;