// /src/routes/api/portfolio/categories/+server.ts
import { db } from '$lib/db/server';
import { categories } from '$lib/db/server/schema';
import { json } from '@sveltejs/kit';

export async function GET() {
  try {
    const categoriesData = await db.select().from(categories);
    return json({ categories: categoriesData });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
