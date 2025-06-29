import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export async function Auth(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    req.data = decodedToken;
    console.log("decodedToken", decodedToken);

    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication Failed!" });
  }
}

export async function IsSuperAdmin(req, res, next) {
  const { id } = req.data;
  const [rows] = await pool.query('SELECT role_name FROM SystemUser WHERE user_id = ?', [id]);
  if (!rows.length || rows[0].role_name !== "super-admin") {
    return res.status(403).json({ msg: "You do not have permission to access this function" });
  }
  next();
}

export async function IsAdmin(req, res, next) {
  const { id } = req.data;
  const [rows] = await pool.query('SELECT role_name FROM SystemUser WHERE user_id = ?', [id]);
  if (!rows.length || rows[0].role_name !== "admin") {
    return res.status(403).json({ msg: "You do not have permission to access this function" });
  }
  next();
}

export async function IsTouroperator(req, res, next) {
  const { id } = req.data;
  const [rows] = await pool.query('SELECT role_name FROM SystemUser WHERE user_id = ?', [id]);
  if (!rows.length || rows[0].role_name !== "tour-operator") {
    return res.status(403).json({ msg: "You do not have permission to access this function" });
  }
  next();
}