export const runtime = 'edge'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Laisser la page de connexion accessible
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Laisser les autres pages passer normalement
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
