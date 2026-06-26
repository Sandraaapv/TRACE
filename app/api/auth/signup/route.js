import { NextResponse } from 'next/server';
import { findUserByUsername, addUser, findAdminByUsername, addAdmin } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, role, adminCode } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (role === 'admin') {
      if (adminCode !== 'TRACE-ADMIN-2026-SECURE') {
        return NextResponse.json({ error: 'Invalid admin security code' }, { status: 403 });
      }

      const existingAdmin = findAdminByUsername(username);
      if (existingAdmin) {
        return NextResponse.json({ error: 'Admin username already exists' }, { status: 400 });
      }

      const newAdmin = { username, password, role: 'admin', createdAt: new Date().toISOString() };
      addAdmin(newAdmin);
      return NextResponse.json({ message: 'Admin registered successfully', user: { username, role: 'admin' } }, { status: 201 });
    } else {
      const existingUser = findUserByUsername(username);
      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }

      const newUser = { username, password, role: 'user', createdAt: new Date().toISOString() };
      addUser(newUser);
      return NextResponse.json({ message: 'User registered successfully', user: { username, role: 'user' } }, { status: 201 });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
