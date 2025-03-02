import express from 'express';
import { verifyOTP, signup, login, createProfile } from '../controllers/authController.js';

const router = express.Router();

router.post('/createprofile', createProfile);
router.patch('/verifyotp', verifyOTP);
router.post('/signup', signup);
router.post('/login', login);

export default router;
