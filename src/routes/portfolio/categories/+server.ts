import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const categoryList = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.category));
    
    return json({ categories: categoryList });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
};
