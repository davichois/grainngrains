import type { Metadata, Viewport } from "next";
import "./admin.css";
import { cookies } from "next/headers";
import { Fira_Sans } from "next/font/google";
import { TEXT_COOKIE, THEME_COOKIE, readTextSize, readTheme } from "@/src/lib/admin/theme";

/* Tipografía del panel (solo aquí; la web pública usa las suyas) */
const firaSans = Fira_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/* Panel administrativo: fuera de los idiomas de la web, solo en español,
   sin índice en buscadores */
export const metadata: Metadata = {
  title: { default: "Panel · Grain & Grains", template: "%s · Panel G&G" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0E0E" },
  ],
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Claro u oscuro elegido en el menú; sin elegir, el del sistema */
  const jar = await cookies();
  const theme = readTheme(jar.get(THEME_COOKIE)?.value);
  const text = readTextSize(jar.get(TEXT_COOKIE)?.value);
  return (
    <html
      lang="es"
      className="admin-theme"
      data-theme={theme === "system" ? undefined : theme}
      data-text={text === "md" ? undefined : text}
    >
      <body className="min-h-svh bg-adm-bg text-adm-ink antialiased">
        {/* Fira Sans en todo el panel */}
        <div className={`relative min-h-svh bg-adm-bg text-adm-ink ${firaSans.className}`}>{children}</div>
      </body>
    </html>
  );
}
