import { db } from '$lib/db/server';
import { portfolios, user, categories } from '$lib/db/server/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export async function load() {
  const [portfolioData, usersData, categoriesData] = await Promise.all([
    db
      .select({
        id: portfolios.id,
        title: portfolios.title,
        description: portfolios.description,
        url: portfolios.projectUrl,
        userId: portfolios.userId,
        categoryId: portfolios.categoryId,
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
      .leftJoin(categories, eq(portfolios.categoryId, categories.id)),
    
    db.select().from(user),
    db.select().from(categories)
  ]);

  return {
    portfolios: portfolioData,
    user: usersData,
    categories: categoriesData
  };
}

export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const title = data.get('title') as string;
    const description = data.get('description') as string;
    const projectUrl = data.get('url') as string;
    const userId = parseInt(data.get('userId') as string);
    const categoryId = parseInt(data.get('categoryId') as string);

    if (!title || !description || !projectUrl || !userId || !categoryId) {
      return fail(400, { message: 'All fields are required' });
    }

    try {
      await db.insert(portfolios).values({
        title,
        description,
        projectUrl,
        userId,
        categoryId
      });

      return { success: true };
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
    const projectUrl = data.get('url') as string;
    const userId = parseInt(data.get('userId') as string);
    const categoryId = parseInt(data.get('categoryId') as string);

    if (!id || !title || !description || !projectUrl || !userId || !categoryId) {
      return fail(400, { message: 'All fields are required' });
    }

    try {
      await db
        .update(portfolios)
        .set({
          title,
          description,
          projectUrl,
          userId,
          categoryId
        })
        .where(eq(portfolios.id, id));

      return { success: true };
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
