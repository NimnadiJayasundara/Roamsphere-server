import SystemUser from "../models/systemUserModel.js";

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
    if ( !user || user.length === 0) {
      return res.status(200).json({ exists: false });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error finding user by email:', error);
    res.status(500).json({ message: 'Error finding user by email', error: error.message });
  }
};