import { pool } from '../config/db.js';

const systemuserTableQuery=`CREATE TABLE IF NOT EXISTS SystemUser (
    user_id VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    user_name VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role_name ENUM('super-admin', 'admin', 'tour-operator', 'driver'),
    email VARCHAR(255) UNIQUE,
    otp VARCHAR(4),
    otp_created_at TIMESTAMP NULL
);`

const adminTableQuery=`CREATE TABLE IF NOT EXISTS Admin (
    admin_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES SystemUser(user_id)
);`

const driverTableQuery = `
CREATE TABLE IF NOT EXISTS Driver (
    driver_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE,
    mobile VARCHAR(15),
    license_no VARCHAR(100),
    issuing_date DATE,
    expiry_date DATE,
    license_type VARCHAR(50),
    experience_years INT,
    image_url TEXT,
    address TEXT,
    age INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES SystemUser(user_id)
);`;

const vehicleTableQuery = `
CREATE TABLE IF NOT EXISTS Vehicle (
    vehicle_id VARCHAR(255) PRIMARY KEY,
    vehicle_type VARCHAR(100),
    model VARCHAR(100),
    year INT,
    seating_capacity INT,
    color VARCHAR(50),
    ownership VARCHAR(100),
    registration_province VARCHAR(100),
    license_plate VARCHAR(50) UNIQUE,
    chassis_no VARCHAR(100) UNIQUE,
    registration_date DATE,
    expiry_date DATE,
    insurance TEXT,
    category ENUM('Luxury', 'Safari', 'Tour', 'Adventure', 'Casual'),
    availability ENUM('Available', 'Unavailable', 'Maintenance', 'Booked'),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES Driver(driver_id)
);`;

const createTable = async (tableName,query) => {
    try {
        await pool.query(query);
        console.log(`${tableName} table created or already exists`);
    } catch (error) {
        console.error(`Failed to create table ${tableName}`, error.message);
        throw error;
    }
}

const createAllTable = async () => {
    try{
    await createTable('SystemUser',systemuserTableQuery);
    await createTable('Admin',adminTableQuery);	
    await createTable('Driver',driverTableQuery);
    await createTable('Vehicle', vehicleTableQuery);
    console.log('All tables created sucessfully');
} catch (error) {
    throw error;
}
};

export default createAllTable;
