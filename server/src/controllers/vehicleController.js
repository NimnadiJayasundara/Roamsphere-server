import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db.js';

export const addVehicle = async (req, res) => {
  try {
    console.log('Received vehicle request body:', req.body);
    
    const {
      email,
      vehicle_type,
      model,
      year,
      seating_capacity,
      color,
      ownership,
      registration_province,
      license_plate,
      chassis_no,
      registration_date,
      expiry_date,
      insurance,
      category,
      image_url,
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    console.log('Looking for driver with email:', email);

    // Check if driver exists by email and get their details
    const [existingDriver] = await pool.query(
      `SELECT d.driver_id, su.first_name, su.last_name 
       FROM Driver d 
       INNER JOIN SystemUser su ON d.user_id = su.user_id 
       WHERE su.email = ? AND su.role_name = 'driver'`,
      [email]
    );

    console.log('Database query result:', existingDriver);

    if (existingDriver.length === 0) {
      return res.status(404).json({ 
        message: 'Driver not found. Please register as a driver first.' 
      });
    }

    const driver_id = existingDriver[0].driver_id;
    console.log('Found driver_id:', driver_id);

    // Check if vehicle record already exists for this driver
    const [existingVehicle] = await pool.query(
      'SELECT vehicle_id FROM Vehicle WHERE driver_id = ?',
      [driver_id]
    );

    if (existingVehicle.length > 0) {
      return res.status(409).json({ 
        message: 'Vehicle profile already exists for this driver.' 
      });
    }

    // Insert into Vehicle table
    const vehicle_id = uuidv4();
    console.log('Inserting vehicle with ID:', vehicle_id);
    
    const vehicleQuery = `
      INSERT INTO Vehicle (
        vehicle_id, driver_id, vehicle_type, model, year, seating_capacity,
        color, ownership, registration_province, license_plate, chassis_no,
        registration_date, expiry_date, insurance, category, image_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const vehicleValues = [
      vehicle_id,
      driver_id,
      vehicle_type,
      model,
      year,
      seating_capacity,
      color,
      ownership,
      registration_province,
      license_plate,
      chassis_no,
      registration_date,
      expiry_date,
      insurance,
      category,
      image_url,
    ];
    
    console.log('Vehicle values to insert:', vehicleValues);
    
    await pool.query(vehicleQuery, vehicleValues);

    console.log('Vehicle successfully inserted');

    res.status(201).json({ 
      message: 'Vehicle profile successfully added.',
      vehicle_id: vehicle_id,
      driver_id: driver_id,
      driver_name: `${existingDriver[0].first_name} ${existingDriver[0].last_name}`
    });
  } catch (err) {
    console.error('Error adding vehicle - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    console.log('Received vehicle update request body:', req.body);
    
    const {
      email,
      vehicle_type,
      model,
      year,
      seating_capacity,
      color,
      ownership,
      registration_province,
      license_plate,
      chassis_no,
      registration_date,
      expiry_date,
      insurance,
      category,
      image_url,
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    console.log('Looking for driver with email:', email);

    // Check if driver exists by email and get their details
    const [existingDriver] = await pool.query(
      `SELECT d.driver_id, su.first_name, su.last_name 
       FROM Driver d 
       INNER JOIN SystemUser su ON d.user_id = su.user_id 
       WHERE su.email = ? AND su.role_name = 'driver'`,
      [email]
    );

    if (existingDriver.length === 0) {
      return res.status(404).json({ 
        message: 'Driver not found. Please register as a driver first.' 
      });
    }

    const driver_id = existingDriver[0].driver_id;
    console.log('Found driver_id:', driver_id);

    // Check if vehicle record exists
    const [existingVehicle] = await pool.query(
      'SELECT vehicle_id FROM Vehicle WHERE driver_id = ?',
      [driver_id]
    );

    if (existingVehicle.length === 0) {
      return res.status(404).json({ 
        message: 'Vehicle profile not found for this driver.' 
      });
    }

    // Update vehicle record
    const updateQuery = `
      UPDATE Vehicle SET 
        vehicle_type = ?, model = ?, year = ?, seating_capacity = ?,
        color = ?, ownership = ?, registration_province = ?, license_plate = ?,
        chassis_no = ?, registration_date = ?, expiry_date = ?, insurance = ?,
        category = ?, image_url = ?
      WHERE driver_id = ?
    `;
    const updateValues = [
      vehicle_type,
      model,
      year,
      seating_capacity,
      color,
      ownership,
      registration_province,
      license_plate,
      chassis_no,
      registration_date,
      expiry_date,
      insurance,
      category,
      image_url,
      driver_id
    ];
    
    console.log('Vehicle values to update:', updateValues);
    
    const [result] = await pool.query(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Vehicle profile not found or no changes made.' 
      });
    }

    console.log('Vehicle successfully updated');

    res.status(200).json({ 
      message: 'Vehicle profile successfully updated.',
      vehicle_id: existingVehicle[0].vehicle_id,
      driver_id: driver_id,
      driver_name: `${existingDriver[0].first_name} ${existingDriver[0].last_name}`
    });
  } catch (err) {
    console.error('Error updating vehicle - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const getVehicleProfileByEmail = async (req, res) => {
  const { email } = req.query;

  try {
    console.log('Fetching vehicle profile for email:', email);

    const [rows] = await pool.query(
      `SELECT 
        v.vehicle_id,
        v.vehicle_type,
        v.model,
        v.year,
        v.seating_capacity,
        v.color,
        v.ownership,
        v.registration_province,
        v.license_plate,
        v.chassis_no,
        v.registration_date,
        v.expiry_date,
        v.insurance,
        v.category,
        v.image_url,
        v.created_at,
        su.first_name,
        su.last_name,
        su.email
      FROM Vehicle v
      INNER JOIN Driver d ON v.driver_id = d.driver_id
      INNER JOIN SystemUser su ON d.user_id = su.user_id 
      WHERE su.email = ? AND su.role_name = 'driver'`,
      [email]
    );

    console.log('Vehicle profile query result:', rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No vehicle profile found for this email.' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching vehicle profile:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllVehicles = async (req, res) => {
  try {
    console.log('Fetching all vehicles...');

    const [rows] = await pool.query(`
      SELECT 
        v.vehicle_id,
        v.vehicle_type,
        v.model,
        v.year,
        v.seating_capacity,
        v.color,
        v.ownership,
        v.registration_province,
        v.license_plate,
        v.chassis_no,
        v.registration_date,
        v.expiry_date,
        v.insurance,
        v.category,
        v.image_url,
        v.created_at,
        su.first_name,
        su.last_name,
        su.email,
        d.mobile
      FROM Vehicle v
      INNER JOIN Driver d ON v.driver_id = d.driver_id
      INNER JOIN SystemUser su ON d.user_id = su.user_id 
      WHERE su.role_name = 'driver'
      ORDER BY v.created_at DESC
    `);

    console.log(`Found ${rows.length} vehicles`);

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching all vehicles:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};