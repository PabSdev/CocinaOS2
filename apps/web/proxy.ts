import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/ingredientes', '/platos', '/productos', '/escandallos', '/clientes'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const projectId =
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || '';
  const cookieName = `a_session_${projectId}`;

  const hasSessionCookie = Boolean(
    request.cookies.get(cookieName)?.value ||
    request.cookies.getAll().some((cookie) => cookie.name.startsWith('a_session_')),
  );

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Si intenta acceder a una ruta protegida del dashboard sin cookie de sesión
  if (isProtected && !hasSessionCookie) {
    const loginUrl = new URL('/iniciar-sesion', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/ingredientes/:path*',
    '/platos/:path*',
    '/productos/:path*',
    '/escandallos/:path*',
    '/clientes/:path*',
  ],
};
