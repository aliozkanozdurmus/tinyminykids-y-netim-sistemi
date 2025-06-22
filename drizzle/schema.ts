import { pgTable, serial, text, varchar, integer, numeric, timestamp, primaryKey, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  pk: primaryKey(table.orderId, table.productId),
}));
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const themeSettings = pgTable('theme_settings', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  selected_theme: varchar('selected_theme', { length: 50 }).notNull().default('light'),
  primary_color: varchar('primary_color', { length: 50 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  app_name: text('app_name').notNull(),
  logo_url: text('logo_url').notNull(),
  password_protection_active: boolean('password_protection_active').notNull(),
  data_source: varchar('data_source', { length: 50 }).notNull(),
  backend_api_url: text('backend_api_url'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const logs = pgTable('logs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  user_id: integer('user_id'),
  user_full_name: text('user_full_name').notNull(),
  user_role: varchar('user_role', { length: 50 }),
  action: varchar('action', { length: 100 }).notNull(),
  details: text('details').notNull(),
  target_id: varchar('target_id', { length: 255 }),
});

export const table_configuration = pgTable('table_configuration', {
  id: serial('id').primaryKey(),
  table_names: text('table_names').array().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});