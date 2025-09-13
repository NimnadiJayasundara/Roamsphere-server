import SystemUser from "../models/systemUserModel.js";
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await SystemUser.findAllUsers();
    res.status(200).json(users); 
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

export const findUserByEmail = async (req, res) => {
  const { email } = req.query;
  try {
    const user = await SystemUser.findUserByEmail(email);
    if (!user || user.length === 0) {
      return res.status(200).json({ exists: false });
    }
    // Return the first user record with exists: true
    res.status(200).json({ 
      exists: true, 
      ...user[0] 
    });
  } catch (error) {
    console.error('Error finding user by email:', error);
    res.status(500).json({ message: 'Error finding user by email', error: error.message });
  }
};

export const addDriver = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    
    const {
      email,
      mobile,
      license_no,
      issuing_date,
      expiry_date,
      license_type,
      experience_years,
      image_url,
      address,
      age,
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    console.log('Looking for user with email:', email);

    // Check if user exists by email and get their details
    const [existingUser] = await pool.query(
      'SELECT user_id, role_name, first_name, last_name FROM SystemUser WHERE email = ?',
      [email]
    );

    console.log('Database query result:', existingUser);

    if (existingUser.length === 0) {
      return res.status(404).json({ 
        message: 'User not found. Please register as a user first.' 
      });
    }

    const user_id = existingUser[0].user_id;
    console.log('Found user_id:', user_id);
    
    // Update role to driver if not already
    if (existingUser[0].role_name !== 'driver') {
      console.log('Updating user role to driver');
      await pool.query(
        'UPDATE SystemUser SET role_name = ? WHERE user_id = ?',
        ['driver', user_id]
      );
    }

    // Check if driver record already exists
    const [existingDriver] = await pool.query(
      'SELECT driver_id FROM Driver WHERE user_id = ?',
      [user_id]
    );

    if (existingDriver.length > 0) {
      return res.status(409).json({ 
        message: 'Driver profile already exists for this user.' 
      });
    }

    // Insert into Driver table
    const driver_id = uuidv4();
    console.log('Inserting driver with ID:', driver_id);
    
    const driverQuery = `
      INSERT INTO Driver (
        driver_id, user_id, mobile, license_no, issuing_date,
        expiry_date, license_type, experience_years, image_url, 
        address, age, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const driverValues = [
      driver_id,
      user_id,
      mobile,
      license_no,
      issuing_date,
      expiry_date,
      license_type,
      experience_years,
      image_url,
      address,
      age,
    ];
    
    console.log('Driver values to insert:', driverValues);
    
    await pool.query(driverQuery, driverValues);

    console.log('Driver successfully inserted');

    res.status(201).json({ 
      message: 'Driver profile successfully added.',
      driver_id: driver_id,
      user_id: user_id,
      driver_name: `${existingUser[0].first_name} ${existingUser[0].last_name}`
    });
  } catch (err) {
    console.error('Error adding driver - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const addDriverDetailsToUser = async (req, res) => {
  try {
    const {
      user_id,
      license_no,
      issuing_date,
      expiry_date,
      license_type,
      experience_years,
      image_url
    } = req.body;

    // First, check if the user exists and update their role to 'driver'
    const [userExists] = await pool.query(
      'SELECT user_id FROM SystemUser WHERE user_id = ?',
      [user_id]
    );

    if (userExists.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update user role to 'driver'
    await pool.query(
      'UPDATE SystemUser SET role_name = ? WHERE user_id = ?',
      ['driver', user_id]
    );

    // Generate driver_id
    const driver_id = uuidv4();

    // Insert into Driver table
    const driverQuery = `
      INSERT INTO Driver (
        driver_id, user_id, license_no, issuing_date,
        expiry_date, license_type, experience_years, image_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const driverValues = [
      driver_id,
      user_id,
      license_no,
      issuing_date,
      expiry_date,
      license_type,
      experience_years,
      image_url
    ];
    
    await pool.query(driverQuery, driverValues);

    res.status(201).json({ 
      message: 'Driver details successfully added to user.',
      driver_id: driver_id
    });
  } catch (err) {
    console.error('Error adding driver details:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

export const updateDriver = async (req, res) => {
  try {
    console.log('Received update request body:', req.body);
    
    const {
      email,
      mobile,
      license_no,
      issuing_date,
      expiry_date,
      license_type,
      experience_years,
      image_url,
      address,
      age,
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    console.log('Looking for user with email:', email);

    // Check if user exists by email and get their details
    const [existingUser] = await pool.query(
      'SELECT user_id, role_name, first_name, last_name FROM SystemUser WHERE email = ?',
      [email]
    );

    console.log('Database query result:', existingUser);

    if (existingUser.length === 0) {
      return res.status(404).json({ 
        message: 'User not found. Please register as a user first.' 
      });
    }

    const user_id = existingUser[0].user_id;
    console.log('Found user_id:', user_id);

    // Check if driver record exists
    const [existingDriver] = await pool.query(
      'SELECT driver_id FROM Driver WHERE user_id = ?',
      [user_id]
    );

    if (existingDriver.length === 0) {
      return res.status(404).json({ 
        message: 'Driver profile not found for this user.' 
      });
    }

    // Update driver record (removed updated_at)
    const updateQuery = `
      UPDATE Driver SET 
        mobile = ?, license_no = ?, issuing_date = ?,
        expiry_date = ?, license_type = ?, experience_years = ?, 
        image_url = ?, address = ?, age = ?
      WHERE user_id = ?
    `;
    const updateValues = [
      mobile,
      license_no,
      issuing_date,
      expiry_date,
      license_type,
      experience_years,
      image_url,
      address,
      age,
      user_id
    ];
    
    console.log('Driver values to update:', updateValues);
    
    const [result] = await pool.query(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Driver profile not found or no changes made.' 
      });
    }

    console.log('Driver successfully updated');

    res.status(200).json({ 
      message: 'Driver profile successfully updated.',
      driver_id: existingDriver[0].driver_id,
      user_id: user_id,
      driver_name: `${existingUser[0].first_name} ${existingUser[0].last_name}`
    });
  } catch (err) {
    console.error('Error updating driver - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const getDriverProfileByEmail = async (req, res) => {
  const { email } = req.query;

  try {
    console.log('Fetching driver profile for email:', email);

    // Remove updated_at from SELECT query
    const [rows] = await pool.query(
      `SELECT 
        su.first_name, 
        su.last_name, 
        su.email,
        d.mobile,
        d.license_no,
        d.issuing_date,
        d.expiry_date,
        d.license_type,
        d.experience_years,
        d.image_url,
        d.address,
        d.age,
        d.created_at
      FROM SystemUser su 
      INNER JOIN Driver d ON su.user_id = d.user_id 
      WHERE su.email = ? AND su.role_name = 'driver'`,
      [email]
    );

    console.log('Driver profile query result:', rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No driver profile found for this email.' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching driver profile:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};