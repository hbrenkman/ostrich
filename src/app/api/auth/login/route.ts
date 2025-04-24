import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to normalize usernames for comparison
function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    console.log('Login attempt for:', username);

    // Read users from config file
    const configPath = path.join(process.cwd(), 'public', 'users', 'config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const { users } = JSON.parse(configData);

    // Find user
    const normalizedUsername = normalizeUsername(username);
    const user = users.find(u => 
      normalizeUsername(u.username) === normalizedUsername && 
      u.password === password
    );
    
    if (!user) {
      console.log('User not found or invalid credentials');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('User found, sending verification code');
    // In a real app, send email with 2FA code here
    // For testing, we'll just use a fixed code (12345)

    return NextResponse.json({
      message: 'Verification code sent',
      userId: user.id
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}