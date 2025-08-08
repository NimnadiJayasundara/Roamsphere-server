import express from 'express';
import { getAllUsers, findUserByEmail, getDriverProfileByEmail, addDriver, updateDriver } from '../controllers/userController.js';
import { addVehicle, updateVehicle, getVehicleProfileByEmail, getAllVehicles } from '../controllers/vehicleController.js';
import { Auth, IsSuperAdmin, IsAdmin, IsTouroperator } from '../middlewares/verifyToken.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/finduser', findUserByEmail);

// Protected routes (authentication required)
router.get('/users', Auth, getAllUsers);
router.get('/profile', Auth, getDriverProfileByEmail);

// Driver routes (authentication required)
router.post('/add', Auth, addDriver);
router.put('/update', Auth, updateDriver);

// Vehicle routes (admin/super-admin only)
router.post('/add-vehicle', Auth, IsAdmin, addVehicle);
router.put('/update-vehicle', Auth, IsAdmin, updateVehicle);
router.get('/vehicle-profile', Auth, getVehicleProfileByEmail);
router.get('/vehicles', Auth, getAllVehicles);

export default router;