import express from 'express';
import { getAllUsers, findUserByEmail, getDriverProfileByEmail, addDriver, updateDriver } from '../controllers/userController.js';
import { addVehicle, updateVehicle, getVehicleProfileByEmail, getAllVehicles } from '../controllers/vehicleController.js';

const router = express.Router();

router.get('/users', getAllUsers);
router.get('/finduser', findUserByEmail);
router.post('/add', addDriver);
router.put('/update', updateDriver);
router.get('/profile', getDriverProfileByEmail);

// Vehicle routes
router.post('/add-vehicle', addVehicle);
router.put('/update-vehicle', updateVehicle);
router.get('/vehicle-profile', getVehicleProfileByEmail);
router.get('/vehicles', getAllVehicles);

export default router;