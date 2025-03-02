import SystemUser from "../models/systemUserModel.js";

// Controller function to get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await SystemUser.findAllUsers();
    res.status(200).json(users); // Send users as a JSON response
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Controller function to find user by email
export const findUserByEmail = async (req, res) => {
  const { email } = req.query;
  try {
    const user = await SystemUser.findUserByEmail(email);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error finding user by email:', error);
    res.status(500).json({ message: 'Error finding user by email', error: error.message });
  }
};