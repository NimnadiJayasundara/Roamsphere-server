import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { sendInvitationEmail } from '../config/nodemailer.js';

// Helper function to check if a user already exists by email or username
const checkUserExistence = async (email, userName) => {
  const [result] = await pool.query(`SELECT * FROM SystemUser WHERE email = ? OR user_name = ?`, [email, userName]);
  return result.length > 0; // If result is not empty, the user already exists
};

// Profile creation
const createProfile = async (req, res) => {
  const { firstName, lastName, email, role } = req.body;

  // Validate role
  if (!['super-admin', 'admin', 'tour-operator'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    // Check for existing user
    const userName = email.split('@')[0]; // Generate username from email prefix
    const userExists = await checkUserExistence(email, userName);
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or username already exists.' });
    }

    // Generate a random temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8);

    // Define the user query
    const userQuery = `
      INSERT INTO SystemUser (user_id, first_name, last_name, user_name, password, role_name, email)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?)
    `;

    // Insert user into the database
    await pool.query(userQuery, [firstName, lastName, userName, temporaryPassword, role, email]);

    // Send invitation email with the temporary password
    await sendInvitationEmail(email, `${firstName} ${lastName}, Your temporary password is: ${temporaryPassword}`);

    res.status(200).json({ message: 'User profile created and invitation sent.' });
  } catch (error) {
    console.error('Error creating user profile:', error.message);
    res.status(500).json({ message: 'Failed to create user profile.', error: error.message });
  }
};


/// Signup function with user creation
const signup = async (req, res) => {
  const { fullName, email, password} = req.body;

    // Validate input
    if (!fullName || !email || !password ) {
      return res.status(400).json({ message: 'Full name and email are required.' });
    }
  
    const [firstName, lastName] = fullName.split(' ');

  try {
    const [user] = await pool.query(`SELECT * FROM SystemUser WHERE first_name = ? AND last_name = ? AND email = ? AND password = ?`, [firstName, lastName, email, password]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Automatically send OTP after signup
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate a 4-digit OTP
    const otpCreatedAt = new Date();

    const updateOtpQuery = `
      UPDATE SystemUser 
      SET otp = ?, otp_created_at = ? 
      WHERE email = ?
    `;
    await pool.query(updateOtpQuery, [otp, otpCreatedAt, email]);

    // Send the OTP via email
    await sendInvitationEmail(email, `Your OTP is: ${otp}`);
    // If the user already exists, proceed with the signup process
    res.status(200).json({ message: 'Signup successful!' });
    }
    catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Signup failed.', error: error.message });
  }
};

// Login function with JWT authentication
const login = async (req, res) => {
  const { fullName, email } = req.body;

  // Validate input
  if (!fullName || !email) {
    return res.status(400).json({ message: 'Full name and email are required.' });
  }

  const [firstName, lastName] = fullName.split(' ');

  try {
    // Step 1: Check if the user exists
    const [user] = await pool.query(`SELECT * FROM SystemUser WHERE first_name = ? AND last_name = ? AND email = ?`, [firstName, lastName, email]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Generate a JWT token
    const token = jwt.sign(
      { id: user[0].user_id, role: user[0].role_name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, message: 'Login successful.' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
};

const verifyOTPHelper = async (email, otp) => {
  try {
    const [result] = await pool.query(`SELECT otp, otp_created_at FROM SystemUser WHERE email = ?`, [email]);
    
    if (result.length === 0) {
      return false; // User not found
    }

    const { otp: storedOtp, otp_created_at } = result[0];
    
    // Check if the OTP matches
    if (storedOtp !== otp) {
      return false; // OTP doesn't match
    }

    // Check if the OTP has expired (5 minutes validity)
    const otpAgeInMinutes = (new Date() - new Date(otp_created_at)) / 1000 / 60;
    if (otpAgeInMinutes > 5) {
      return false; // OTP expired
    }

    return true; // OTP is valid and not expired
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return false;
  }
};

// OTP Verification function
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const isValid = await verifyOTPHelper(email, otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    res.status(500).json({ message: 'Failed to verify OTP.', error: error.message });
  }
};

// Update password function
const updatePassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and new password are required.' });
  }

  try {

    // Update the password in the database
    const updatePasswordQuery = `
      UPDATE SystemUser 
      SET password = ? 
      WHERE email = ?
    `;

    const [result] = await pool.query(updatePasswordQuery, [password, email]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Failed to update password:', error);
    res.status(500).json({ message: 'Failed to update password.', error: error.message });
  }
};


export { verifyOTP, signup, createProfile, login, updatePassword };