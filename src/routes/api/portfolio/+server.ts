// /src/routes/api/portfolio/+server.ts
import { db } from '$lib/db/server';
import { portfolios, user, categories } from '$lib/db/server/schema';
import { eq, like, and, sql } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import { FuzzySearch } from '$lib/utils/fuzzySearch';

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
    const fuzzySearch = searchParams.get('fuzzy') === 'true';
    
    // If requesting categories only
    if (categoriesOnly) {
      const categoriesData = await db.select().from(categories);
      return json({ categories: categoriesData });
    }
    
    const offset = (page - 1) * limit;
    
    // Build where conditions for non-search filters
    const conditions = [];
    
    if (category) {
      conditions.push(eq(categories.category, category));
    }
    
    if (dateFrom) {
      conditions.push(sql`${portfolios.createdAt} >= ${dateFrom}`);
    }
    
    if (dateTo) {
      conditions.push(sql`${portfolios.createdAt} <= ${dateTo || '9999-12-31'}`);
    }
    
    // If fuzzy search is enabled and there's a search query
    if (fuzzySearch && search) {
      // Get all portfolios with basic filters first
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const allPortfolios = await db
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
        .orderBy(portfolios.createdAt);
      
      // Apply fuzzy search
      const fuzzySearcher = new FuzzySearch(allPortfolios, {
        threshold: 0.4,
        keys: ['title', 'description', 'tags', 'user.name', 'category.category'],
        includeScore: true,
        shouldSort: true,
        tokenize: true,
        minMatchCharLength: 2
      });
      
      const searchResults = fuzzySearcher.search(search);
      const totalCount = searchResults.length;
      const totalPages = Math.ceil(totalCount / limit);
      
      // Apply pagination to fuzzy search results
      const paginatedResults = searchResults
        .slice(offset, offset + limit)
        .map(result => result.item);
      
      return json({
        portfolios: paginatedResults,
        currentPage: page,
        totalPages,
        totalCount,
        searchScore: searchResults.length > 0 ? searchResults[0].score : null
      });
    }
    
    // Regular search (non-fuzzy)
    if (search) {
      conditions.push(
        like(portfolios.title, `%${search}%`)
      );
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
