import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../..', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../..', 'dist', 'index.html'));
});

app.use('/', healthRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});