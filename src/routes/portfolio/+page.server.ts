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
    categories: categoriesData
  };
}

