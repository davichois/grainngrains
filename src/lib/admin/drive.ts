/** Un enlace de Google Drive para compartir ("…/file/d/<id>/view", "open?id=<id>",
 *  "uc?id=<id>") se convierte en uno directo a la imagen, que sí se puede
 *  mostrar en la web. Cualquier otro enlace queda igual. */
export function driveDirect(url: string) {
  const u = url.trim();
  if (!/^https:\/\/(drive|docs)\.google\.com\//.test(u)) return u;
  const id = u.match(/\/d\/([\w-]{10,})/)?.[1] ?? u.match(/[?&]id=([\w-]{10,})/)?.[1];
  return id ? `https://lh3.googleusercontent.com/d/${id}` : u;
}

export const isDriveImage = (url: string) =>
  /^https:\/\/([\w-]+\.)?googleusercontent\.com\//.test(url) || /^https:\/\/drive\.google\.com\//.test(url);

/** Id del archivo en Google Drive de un enlace (directo o para compartir) */
export function driveFileId(url: string | null | undefined) {
  if (!url || !isDriveImage(url)) return null;
  return url.match(/\/d\/([\w-]{10,})/)?.[1] ?? url.match(/[?&]id=([\w-]{10,})/)?.[1] ?? null;
}
