import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const user = sqliteTable('user', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull()
});


export const categories = sqliteTable('categories', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  category: text('category').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at')
});

export const portfolios = sqliteTable('portfolios', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  projectUrl: text('project_url'),
  tags: text('tags'), // JSON string of tags array
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at')
});

export type User = typeof user.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Portfolio = typeof portfolios.$inferSelect;

export type NewUser = typeof user.$inferInsert;
export type NewCategory = typeof categories.$inferInsert;
export type NewPortfolio = typeof portfolios.$inferInsert;

export type InsertUser = typeof user.$inferInsert;
export type InsertCategory = typeof categories.$inferInsert;
export type InsertPortfolio = typeof portfolios.$inferInsert;
