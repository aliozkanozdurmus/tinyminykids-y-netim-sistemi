import express from 'express';
import cors from 'cors';
import { db } from './db';
import * as schema from '../drizzle/schema';

const app = express();
app.use(cors());
app.use(express.json());

type Resource = { name: string; table: any };
const resources: Resource[] = [
  { name: 'users', table: schema.users },
  { name: 'products', table: schema.products },
  { name: 'orders', table: schema.orders },
  { name: 'sessions', table: schema.sessions },
  { name: 'theme_settings', table: schema.themeSettings },
  { name: 'logs', table: schema.logs },
  { name: 'table_configuration', table: schema.table_configuration },
];

resources.forEach(({ name, table }) => {
  app.get(`/${name}`, async (req, res) => {
    try {
      const items = await db.select().from(table);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get(`/${name}/:id`, async (req, res) => {
    try {
      const item = await db
        .select()
        .from(table)
        .where(table.id.eq(Number(req.params.id)))
        .limit(1);
      res.json(item[0] || null);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post(`/${name}`, async (req, res) => {
    try {
      const data = req.body;
      const [created] = await db.insert(table).values(data).returning();
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put(`/${name}/:id`, async (req, res) => {
    try {
      const data = req.body;
      const [updated] = await db
        .update(table)
        .set(data)
        .where(table.id.eq(Number(req.params.id)))
        .returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete(`/${name}/:id`, async (req, res) => {
    try {
      const [deleted] = await db
        .delete(table)
        .where(table.id.eq(Number(req.params.id)))
        .returning();
      res.json(deleted);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});