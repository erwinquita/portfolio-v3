// +page.server.js
import { db } from '$lib/db/server';
import { portfolios, user, categories } from '$lib/db/server/schema';
import { eq, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export async function load() {
  try {
    const [portfolioData, usersData, categoriesData] = await Promise.all([
      db
        .select({
          id: portfolios.id,
          title: portfolios.title,
          description: portfolios.description,
          imageUrl: portfolios.imageUrl,
          projectUrl: portfolios.projectUrl,
          tags: portfolios.tags,
          userId: portfolios.userId,
          categoryId: portfolios.categoryId,
          createdAt: portfolios.createdAt,
          updatedAt: portfolios.updatedAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          category: {
            id: categories.id,
            category: categories.category
          }
        })
        .from(portfolios)
        .leftJoin(user, eq(portfolios.userId, user.id))
        .leftJoin(categories, eq(portfolios.categoryId, categories.id))
        .orderBy(portfolios.createdAt),
      
      db.select().from(user),
      db.select().from(categories)
    ]);

    return {
      portfolios: portfolioData,
      user: usersData,
      categories: categoriesData
    };
  } catch (error) {
    console.error('Error loading portfolio data:', error);
    return {
      portfolios: [],
      user: [],
      categories: []
    };
  }
}

export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const title = data.get('title') as string;
    const description = data.get('description') as string;
    // Handle both 'url' and 'projectUrl' field names for compatibility
    const projectUrl = (data.get('url') || data.get('projectUrl')) as string;
    const imageUrl = data.get('imageUrl') as string;
    const userId = parseInt(data.get('userId') as string);
    const categoryId = parseInt(data.get('categoryId') as string);
    const tags = data.get('tags') as string; // JSON string

    if (!title || !description || !userId || !categoryId) {
      return fail(400, { message: 'Title, description, user, and category are required' });
    }

    try {
      const [result] = await db.insert(portfolios).values({
        title,
        description,
        projectUrl: projectUrl || null,
        imageUrl: imageUrl || null,
        userId,
        categoryId,
        tags: tags || null,
        updatedAt: sql`(datetime('now'))`
      }).returning();

      return { success: true, portfolio: result };
    } catch (error) {
      console.error('Error creating portfolio:', error);
      return fail(500, { message: 'Failed to create portfolio' });
    }
  },

  update: async ({ request }) => {
    const data = await request.formData();
    const id = parseInt(data.get('id') as string);
    const title = data.get('title') as string;
    const description = data.get('description') as string;
    // Handle both 'url' and 'projectUrl' field names for compatibility
    const projectUrl = (data.get('url') || data.get('projectUrl')) as string;
    const imageUrl = data.get('imageUrl') as string;
    const userId = parseInt(data.get('userId') as string);
    const categoryId = parseInt(data.get('categoryId') as string);
    const tags = data.get('tags') as string; // JSON string

    if (!id || !title || !description || !userId || !categoryId) {
      return fail(400, { message: 'ID, title, description, user, and category are required' });
    }

    try {
      const [result] = await db
        .update(portfolios)
        .set({
          title,
          description,
          projectUrl: projectUrl || null,
          imageUrl: imageUrl || null,
          userId,
          categoryId,
          tags: tags || null,
          updatedAt: sql`(datetime('now'))`
        })
        .where(eq(portfolios.id, id))
        .returning();

      return { success: true, portfolio: result };
    } catch (error) {
      console.error('Error updating portfolio:', error);
      return fail(500, { message: 'Failed to update portfolio' });
    }
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const id = parseInt(data.get('id') as string);

    if (!id) {
      return fail(400, { message: 'Portfolio ID is required' });
    }

    try {
      await db.delete(portfolios).where(eq(portfolios.id, id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      return fail(500, { message: 'Failed to delete portfolio' });
    }
  }
};
