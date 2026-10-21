import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  /* Todas las direcciones salvo la API, los archivos internos de Next y los
     archivos con extensión (imágenes, robots.txt, sitemap.xml…). Así una
     dirección sin idioma (/lo-que-sea) también se lleva a su idioma y, si
     no existe, cae en la 404 propia */
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
