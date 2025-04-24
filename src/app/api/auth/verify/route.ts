import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to normalize usernames for comparison
function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}

export async function POST(request: NextRequest) {
  try {
    const { username, code } = await request.json();

    console.log('Verification attempt for:', username, 'with code:', code);

    // For testing, accept only code 12345
    if (code !== '12345') {
      console.log('Invalid verification code');
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
    }

    // Read users from config file
    const configPath = path.join(process.cwd(), 'public', 'users', 'config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const { users } = JSON.parse(configData);

    // Find user
    const normalizedUsername = normalizeUsername(username);
    const user = users.find(u => normalizeUsername(u.username) === normalizedUsername);
    
    if (!user) {
      console.log('User not found during verification');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User verified successfully');
    // In a real app, verify the code against what was sent
    // For testing, we'll just return the user data

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}