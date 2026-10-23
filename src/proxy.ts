import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, verifySession } from "./lib/admin/session";

const intl = createMiddleware(routing);

/* Panel: sin sesión válida se va al login. Sin índice en buscadores, sin
   caché y sin poder mostrarse dentro de otra web */
async function admin(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  let response: NextResponse;
  if (!session && !isLogin) {
    const url = new URL("/admin/login", request.url);
    if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
    response = NextResponse.redirect(url);
  } else if (session && isLogin) {
    response = NextResponse.redirect(new URL("/admin", request.url));
  } else {
    response = NextResponse.next();
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return admin(request);
  }
  return intl(request);
}

export const config = {
  /* Todas las direcciones salvo la API, los archivos internos de Next y los
     archivos con extensión (imágenes, robots.txt, sitemap.xml…). Así una
     dirección sin idioma (/lo-que-sea) también se lleva a su idioma y, si
     no existe, cae en la 404 propia. /admin pasa por aquí para exigir sesión */
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
