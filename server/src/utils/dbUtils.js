import { pool } from '../config/db.js';

const systemuserTableQuery=`CREATE TABLE SystemUser (
    user_id VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    user_name VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role_name VARCHAR(50),
    email VARCHAR(255) UNIQUE
);`

const adminTableQuery=`CREATE TABLE Admin (
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
