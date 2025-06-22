import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import path from 'path';
import authRouter from './routes/auth';
import usersRouter from './routes/users';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

app.use(express.static(path.join(__dirname, '../..', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../..', 'dist', 'index.html'));
});

app.use('/api/health', healthRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});