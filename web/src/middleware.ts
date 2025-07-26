import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('invisignia_token')?.value;
  const pathname = request.nextUrl.pathname;

  // ruta para loguear
  if (pathname.startsWith('/app')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // si estas logueado, no puedes acceder a login y registro
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  // redirigir a login si no hay token, o a app si hay token
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/app', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};