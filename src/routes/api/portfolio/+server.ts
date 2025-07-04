import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { portfolios, users, categories } from '$lib/server/db/schema';
import { eq, like, and, desc, count } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const categoryFilter = url.searchParams.get('category');
    const searchQuery = url.searchParams.get('search');
    
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const conditions = [];
    if (categoryFilter) {
      conditions.push(eq(categories.category, categoryFilter));
    }
    if (searchQuery) {
      conditions.push(
        like(portfolios.title, `%${searchQuery}%`)
      );
    }
    
    // Get total count
    const totalCountQuery = db
      .select({ count: count() })
      .from(portfolios)
      .innerJoin(users, eq(portfolios.userId, users.id))
      .innerJoin(categories, eq(portfolios.categoryId, categories.id));
    
    if (conditions.length > 0) {
      totalCountQuery.where(and(...conditions));
    }
    
    const [{ count: totalCount }] = await totalCountQuery;
    
    // Get portfolios with pagination
    const portfoliosQuery = db
      .select({
        id: portfolios.id,
        title: portfolios.title,
        description: portfolios.description,
        url: portfolios.projectUrl,
        userId: portfolios.userId,
        categoryId: portfolios.categoryId,
        createdAt: portfolios.createdAt,
        userName: users.name,
        userEmail: users.email,
        category: categories.category,
      })
      .from(portfolios)
      .innerJoin(users, eq(portfolios.userId, users.id))
      .innerJoin(categories, eq(portfolios.categoryId, categories.id))
      .orderBy(desc(portfolios.createdAt))
      .limit(limit)
      .offset(offset);
    
    if (conditions.length > 0) {
      portfoliosQuery.where(and(...conditions));
    }
    
    const portfolioList = await portfoliosQuery;
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return json({
      portfolios: portfolioList,
      currentPage: page,
      totalPages,
      totalCount,
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return json({ error: 'Failed to fetch portfolios' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    const { title, description, projectUrl, userId, categoryId } = data;
    
    if (!title || !description || !projectUrl || !userId || !categoryId) {
      return json({ error: 'All fields are required' }, { status: 400 });
    }
    
    const [newPortfolio] = await db
      .insert(portfolios)
      .values({
        title,
        description,
        projectUrl,
        userId: parseInt(userId),
        categoryId: parseInt(categoryId),
      })
      .returning();
    
    return json({ portfolio: newPortfolio }, { status: 201 });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return json({ error: 'Failed to create portfolio' }, { status: 500 });
  }
};
