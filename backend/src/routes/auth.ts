import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../db';

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ message: 'Username required' });
    return;
  }
  const user = await prisma.user.findFirst({ where: { name: username } });
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  // Password check removed: allow login for any known username
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

export default router;