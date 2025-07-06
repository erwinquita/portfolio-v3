import { json } from '@sveltejs/kit';
import { db } from '$lib/db/server';
import { user } from '$lib/db/server/schema';
import { asc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const userList = await db
      .select()
      .from(user)
      .orderBy(asc(user.name));
    
    return json({ user: userList });
  } catch (error) {
    console.error('Error fetching users:', error);
    return json({ error: 'Failed to fetch users' }, { status: 500 });
  }
};
