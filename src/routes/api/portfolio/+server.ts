// /src/routes/api/portfolio/+server.ts
import { db } from '$lib/db/server';
import { portfolios, user, categories } from '$lib/db/server/schema';
import { eq, like, and, sql } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
  try {
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const categoriesOnly = searchParams.get('categories');
    
    // If requesting categories only
    if (categoriesOnly) {
      const categoriesData = await db.select().from(categories);
      return json({ categories: categoriesData });
    }
    
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const conditions = [];
    
    if (category) {
      conditions.push(eq(categories.category, category));
    }
    
    if (search) {
      conditions.push(
        like(portfolios.title, `%${search}%`)
      );
    }
    
    if (dateFrom) {
      conditions.push(sql`${portfolios.createdAt} >= ${dateFrom}`);
    }
    
    if (dateTo) {
      conditions.push(sql`${portfolios.createdAt} <= ${dateTo || '9999-12-31'}`);
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(portfolios)
      .leftJoin(categories, eq(portfolios.categoryId, categories.id))
      .where(whereClause);
    
    const totalPages = Math.ceil(totalCount.count / limit);
    
    // Get paginated portfolios with joined data
    const portfolioData = await db
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
      .where(whereClause)
      .orderBy(portfolios.createdAt)
      .limit(limit)
      .offset(offset);
    
    return json({
      portfolios: portfolioData,
      currentPage: page,
      totalPages,
      totalCount: totalCount.count
    });
    
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return json({ error: 'Failed to fetch portfolios' }, { status: 500 });
  }
}
