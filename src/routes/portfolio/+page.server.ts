import { db } from '$lib/server/db';
import { portfolios, users, categories } from '$lib/server/db/schema';
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
      .leftJoin(categories, eq(portfolios.categoryId, categories.id)),
    
    db.select().from(categories)
  ]);

  return {
    portfolios: portfolioData,
    categories: categoriesData
  };
}
