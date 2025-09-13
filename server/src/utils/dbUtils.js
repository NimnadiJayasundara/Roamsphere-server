import { pool } from '../config/db.js';

const systemuserTableQuery=`CREATE TABLE IF NOT EXISTS SystemUser (
    user_id VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    user_name VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role_name ENUM('super-admin', 'admin', 'tour-operator'),
    email VARCHAR(255) UNIQUE,
    otp VARCHAR(4),
    otp_created_at TIMESTAMP NULL
);`

const adminTableQuery=`CREATE TABLE IF NOT EXISTS Admin (
    admin_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES SystemUser(user_id)
);`


const createTable = async (tableName,query) => {
    try {
        await pool.query(query);
        console.log(`${tableName} table created or already exists`);
        connection.release();
    } catch (error) {
        console.error(`Failed to create table ${tableName}`, error.message);
    }
}

const createAllTable = async () => {
    try{
    await createTable('SystemUser',systemuserTableQuery);
    await createTable('Admin',adminTableQuery);	
    console.log('All tables created sucessfully');
} catch (error) {
    throw error;
}
};

export default createAllTable;
