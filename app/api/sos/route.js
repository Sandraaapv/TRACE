import { NextResponse } from 'next/server';
import { getSosAlerts, addSosAlert, clearSosAlert } from '@/lib/db';

export async function GET() {
  try {
    const alerts = getSosAlerts();
    return NextResponse.json({ alerts }, { status: 200 });
  } catch (error) {
    console.error('SOS GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, location } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required to trigger SOS' }, { status: 400 });
    }

    const alert = {
      username,
      location: location || null,
      timestamp: new Date().toISOString(),
      active: true
    };

    addSosAlert(alert);
    return NextResponse.json({ message: 'SOS Alert triggered successfully', alert }, { status: 201 });
  } catch (error) {
    console.error('SOS POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required to clear SOS alert' }, { status: 400 });
    }

    clearSosAlert(username);
    return NextResponse.json({ message: `SOS Alert for ${username} cleared successfully` }, { status: 200 });
  } catch (error) {
    console.error('SOS DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
