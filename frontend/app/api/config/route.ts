import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the API key from the environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured on server' },
        { status: 500 }
      );
    }
    
    // Return the API key to the client
    return NextResponse.json({ apiKey }, { status: 200 });
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve API key' },
      { status: 500 }
    );
  }
}