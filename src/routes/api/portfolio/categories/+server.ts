import { json } from '@sveltejs/kit';
import { db } from '$lib/db/server';
import { categories } from '$lib/db/server/schema';
import { asc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Make sure we're only handling the categories endpoint
    console.log('Fetching categories from:', url.pathname);
    
    const categoryList = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.category));
    
    console.log('Categories found:', categoryList.length);
    
    return json({ categories: categoryList });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
};
