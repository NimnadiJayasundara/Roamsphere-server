import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { checkConnection } from './src/config/db.js';
import createAllTable  from './src/utils/dbUtils.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';


const app = express();
app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ['GET','POST','PUT','PATCH','DELETE'],
    credentials: true
})) 

app.use(express.json()); // Middleware to parse JSON data
app.use(bodyParser.json());
app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes); 


app.get('/', (req, res) => { res.send('Welcome to the API'); });

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

