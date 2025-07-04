import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { portfolios, users, categories } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return json({ error: 'Invalid portfolio ID' }, { status: 400 });
    }

    const portfolio = await db
      .select({
        id: portfolios.id,
        title: portfolios.title,
        description: portfolios.description,
        url: portfolios.projectUrl,
        userId: portfolios.userId,
        categoryId: portfolios.categoryId,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        category: {
          id: categories.id,
          category: categories.category
        }
      })
      .from(portfolios)
      .leftJoin(users, eq(portfolios.userId, users.id))
      .leftJoin(categories, eq(portfolios.categoryId, categories.id))
      .where(eq(portfolios.id, id));

    if (portfolio.length === 0) {
      return json({ error: 'Portfolio not found' }, { status: 404 });
    }

    return json(portfolio[0]);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

export async function PUT({ params, request }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return json({ error: 'Invalid portfolio ID' }, { status: 400 });
    }

    const { title, description, projectUrl, userId, categoryId } = await request.json();

    if (!title || !description || !projectUrl || !userId || !categoryId) {
      return json({ error: 'All fields are required' }, { status: 400 });
    }

    const result = await db
      .update(portfolios)
      .set({
        title,
        description,
        projectUrl,
        userId,
        categoryId
      })
      .where(eq(portfolios.id, id))
      .returning();

    if (result.length === 0) {
      return json({ error: 'Portfolio not found' }, { status: 404 });
    }

    return json(result[0]);
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return json({ error: 'Failed to update portfolio' }, { status: 500 });
  }
}

export async function DELETE({ params }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return json({ error: 'Invalid portfolio ID' }, { status: 400 });
    }

    const result = await db
      .delete(portfolios)
      .where(eq(portfolios.id, id))
      .returning();

    if (result.length === 0) {
      return json({ error: 'Portfolio not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return json({ error: 'Failed to delete portfolio' }, { status: 500 });
  }
}
