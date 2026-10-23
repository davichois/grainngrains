import "server-only";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

/** Imágenes que ya están en public/images (para elegirlas en el panel) */
export function publicImages() {
  const root = path.join(process.cwd(), "public", "images");
  const out: { src: string; folder: string; name: string }[] = [];
  const walk = (dir: string) => {
    let entries: string[] = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries.sort()) {
      const full = path.join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(webp|png|jpe?g|avif|svg)$/i.test(e)) {
        const rel = path.relative(path.join(process.cwd(), "public"), full).split(path.sep).join("/");
        out.push({ src: `/${rel}`, folder: path.relative(root, dir).split(path.sep).join("/") || "images", name: e });
      }
    }
  };
  walk(root);
  return out;
}

export type PublicImage = ReturnType<typeof publicImages>[number];
