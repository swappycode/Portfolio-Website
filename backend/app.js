import 'dotenv/config';
import express from 'express';
import {PORT} from './config/env.js';
import gitRouter from './routes/github.routes.js';
import itchRouter from './routes/itch.routes.js';


import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan('combined'));


app.use('/api/v1/gitprojects', gitRouter);
app.use('/api/v1/itchprojects',itchRouter);


app.get('/', (req, res) => {
    res.send('Who Am I');
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, 'localhost', async () => {
    console.log(`server is running on http://localhost:${PORT}`);
});
