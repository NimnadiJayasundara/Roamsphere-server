import express from 'express';
//import userRoutes from './routes/userRoutes.js';
import { checkConnection } from './src/config/db.js';
import createAllTable  from './src/utils/dbUtils.js';

const app = express();

app.use(express.json()); // Middleware to parse JSON data
//app.use('/api/users', userRoutes); //Use user routes for API calls

app.listen(3000, async() => {
    console.log('Server is running on port 3000');
    try {
        //Check database connection
        await checkConnection();
        await createAllTable();
    } catch (error) {
        console.error("Failed to initialize database connection",error);
    }
});

