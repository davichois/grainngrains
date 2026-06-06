import Image from "next/image";
import { ShowcaseProduct } from "./types";

interface ProductCardProps {
  product: ShowcaseProduct;
  /** Color de la categoría, usado como fondo cuando el producto no define `cardBg` */
  accent: string;
  /** Nombre traducido del producto (i18n) */
  name: string;
}

/* Tamaños responsivos: 2 columnas en móvil (~50vw), 4 en escritorio (~25vw) */
const IMG_SIZES = "(max-width: 480px) 50vw, 25vw";

export default function ProductCard({ product, accent, name }: ProductCardProps) {
  const cardBg = product.cardBg ?? accent;

  return (
    <div
      className="group relative aspect-square w-full cursor-pointer overflow-hidden"
      style={{ backgroundColor: cardBg }}
    >
      {/* Imagen frontal: zoom suave y desvanecido lento al hacer hover */}
      {product.image ? (
        <Image
          src={product.image}
          alt={name}
          fill
          sizes={IMG_SIZES}
          className="object-cover transition-[transform,opacity] duration-1100 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-hover:opacity-0"
        />
      ) : (
        <div
          className="absolute inset-0 transition-[transform,opacity] duration-1100 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-hover:opacity-0"
          style={{ background: product.bg }}
        />
      )}

      {/* Imagen de hover: aparece con un zoom de fondo apenas perceptible */}
      {product.hoverImage ? (
        <Image
          src={product.hoverImage}
          alt={name}
          fill
          sizes={IMG_SIZES}
          className="scale-[1.04] object-cover opacity-0 transition-[transform,opacity] duration-1100 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-100 group-hover:opacity-100"
        />
      ) : (
        <div
          className="absolute inset-0 scale-[1.04] opacity-0 transition-[transform,opacity] duration-1100 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-100 group-hover:opacity-100"
          style={{ background: product.bg }}
        />
      )}

      {/* Degradado + nombre */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10  to-transparent p-[clamp(10px,1.2vw,16px)] pt-[clamp(24px,3vw,40px)]">
        <p className="text-[clamp(22px,1.4vw,36px)] text-center font-semibold text-white">
          {name}
        </p>
      </div>
    </div>
  );
}
