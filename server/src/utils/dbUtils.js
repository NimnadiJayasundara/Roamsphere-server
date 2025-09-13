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
    availability ENUM('available', 'on-trip', 'on-leave', 'offline', 'maintenance') DEFAULT 'offline',
    preferred_trip_types JSON,
    last_location_lat DECIMAL(10, 8) NULL,
    last_location_lng DECIMAL(11, 8) NULL,
    last_location_update TIMESTAMP NULL,
    status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES SystemUser(user_id)
);`;

const vehicleTableQuery = `
CREATE TABLE IF NOT EXISTS Vehicle (
    vehicle_id VARCHAR(255) PRIMARY KEY,
    driver_id VARCHAR(255),
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

const customerTableQuery = `
CREATE TABLE IF NOT EXISTS Customer (
    customer_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    marketing_emails BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    address TEXT,
    loyalty_points INT DEFAULT 0,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES SystemUser(user_id)
);`;

const tripTableQuery = `
CREATE TABLE IF NOT EXISTS Trip (
    trip_id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    category ENUM('Luxury', 'Safari', 'Tour', 'Adventure', 'Casual') NOT NULL,
    origin VARCHAR(500) NOT NULL,
    destination VARCHAR(500) NOT NULL,
    stops TEXT,
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    return_date DATE NULL,
    return_time TIME NULL,
    passenger_count INT NOT NULL DEFAULT 1,
    passenger_names TEXT,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(100),
    special_requirements TEXT,
    budget VARCHAR(100),
    notes TEXT,
    status ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
    assigned_driver_id VARCHAR(255) NULL,
    assigned_vehicle_id VARCHAR(255) NULL,
    estimated_cost DECIMAL(10,2) NULL,
    actual_cost DECIMAL(10,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (assigned_driver_id) REFERENCES Driver(driver_id),
    FOREIGN KEY (assigned_vehicle_id) REFERENCES Vehicle(vehicle_id)
);`;

// Driver Statistics Table for dashboard metrics
const driverStatisticsQuery = `
CREATE TABLE IF NOT EXISTS DriverStatistics (
    stat_id VARCHAR(255) PRIMARY KEY,
    driver_id VARCHAR(255),
    total_trips INT DEFAULT 0,
    completed_trips INT DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_distance DECIMAL(10,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
    await createTable('Customer', customerTableQuery);
    await createTable('Trip', tripTableQuery);
    await createTable('DriverStatistics', driverStatisticsQuery);
    console.log('All tables created sucessfully');
} catch (error) {
    throw error;
}
};

export default createAllTable;