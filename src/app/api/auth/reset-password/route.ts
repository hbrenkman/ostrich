import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    // Read users from config file
    const configPath = path.join(process.cwd(), 'public', 'users', 'config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const { users } = JSON.parse(configData);

    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // In a real app, send password reset email here
    // For testing, we'll just return success

    return NextResponse.json({
      message: 'Password reset instructions sent'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Failed to process password reset' }, { status: 500 });
  }
}