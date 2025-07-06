import { db } from '$lib/db/server';
import { portfolios, user, categories } from '$lib/db/server/schema';
import { eq } from 'drizzle-orm';

export async function load() {
  const [portfolioData, categoriesData] = await Promise.all([
    db
      .select({
        id: portfolios.id,
        title: portfolios.title,
        description: portfolios.description,
        url: portfolios.projectUrl,
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
    
    db.select().from(categories)
  ]);

  return {
    portfolios: portfolioData,
    categories: categoriesData
  };
}
