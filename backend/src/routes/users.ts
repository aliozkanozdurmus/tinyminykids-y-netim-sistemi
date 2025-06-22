import express, { Request, Response } from 'express';
import prisma from '../db';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  const { role } = req.query;
  const where: any = {};
  if (role && typeof role === 'string') {
    where.role = role;
  }
  try {
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving users' });
  }
});

export default router;