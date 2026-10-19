import type { ComponentProps } from "react";
import { Link } from "@/src/i18n/navigation";

/**
 * Enlace del menú: las rutas internas usan el Link con idioma; las URLs
 * externas (https://…) se abren en una pestaña nueva.
 */
export default function SmartLink({
  href,
  ...props
}: Omit<ComponentProps<"a">, "href"> & { href: string }) {
  if (/^https?:\/\//.test(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
  }
  return <Link href={href} {...props} />;
}
