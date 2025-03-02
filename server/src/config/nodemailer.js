import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create the transporter using Gmail's SMTP settings
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use Gmail's service
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, // app password (for 2FA)
  },
  tls: {
    rejectUnauthorized: false,  // This line is to avoid SSL certificate issues
  },
});

// Function to send invitation email
export const sendInvitationEmail = async (email, tempPassword) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,  // Sender email address
    to: email,                     
    subject: 'Welcome to RoamSphere', 
    text: `You have been invited to join RoamSphere. Use this temporary password to login: ${tempPassword}.\nPlease change your password after your first login.`, // Email body text
  };

  try {
    await transporter.sendMail(mailOptions);  // Correct call to send the email
    console.log('Invitation email sent to:', email);
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error;  // Let the calling function handle this
  }
};