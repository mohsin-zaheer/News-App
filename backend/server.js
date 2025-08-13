import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import connectDB from './config/db.js';
import authRouter from './routes/auth.js';

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
