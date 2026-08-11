import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
    // In a real deployment, client-side auth checks should be used.
    // Middleware here is a placeholder for route-level guarding.
    return NextResponse.next()
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
