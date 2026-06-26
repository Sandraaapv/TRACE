import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

export async function GET() {
  try {
    const users = getUsers();
    const safeUsers = users.map(u => ({ username: u.username, createdAt: u.createdAt }));
    return NextResponse.json({ users: safeUsers }, { status: 200 });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
