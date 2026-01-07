import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Check auth for dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const session = request.cookies.get('session')?.value;
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Update session expiration on activity
    return await updateSession(request);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

