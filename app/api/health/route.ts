// Health check endpoint for AWS Amplify
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ai-tool-box',
    environment: process.env.NODE_ENV || 'production'
  });
}
