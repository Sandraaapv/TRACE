import { NextResponse } from 'next/server';
import { findUserByUsername, findAdminByUsername } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Username, password, and role are required' }, { status: 400 });
    }

    if (role === 'admin') {
      const admin = findAdminByUsername(username);
      if (!admin || admin.password !== password) {
        return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
      }
      return NextResponse.json({ message: 'Login successful', user: { username: admin.username, role: 'admin' } }, { status: 200 });
    } else {
      const user = findUserByUsername(username);
      if (!user || user.password !== password) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      return NextResponse.json({ message: 'Login successful', user: { username: user.username, role: 'user' } }, { status: 200 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
