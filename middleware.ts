import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0]; // strip port if present

  if (hostname === 'www.dipemsa.com.mx') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.hostname = 'dipemsa.com.mx';
    url.port = '';
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
