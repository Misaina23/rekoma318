import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Laisser librement accessible la page de connexion
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Pour toutes les autres routes /admin,
  // laisser la page gérer l'authentification côté client.
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}