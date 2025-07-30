import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('invisignia_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Rutas que requieren autenticación
  if (pathname.startsWith('/app')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Si ya estás logueado, redirigir login/register a /app
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  // La raíz (/) ahora será la landing page pública
  // Solo redirigir a /app si hay token Y se está accediendo a rutas protegidas
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};