import Image from "next/image";
import type { ShowcaseProduct } from "@/src/components/product-showcase/types";

interface ComboStripProps {
  products: { product: ShowcaseProduct; bg: string }[];
  /** Ancho aproximado en px de la tira completa (para `sizes`) */
  width: number;
  className?: string;
}

/** Tira con las fotos de los cafés de un combo, una junto a otra */
export default function ComboStrip({
  products,
  width,
  className = "",
}: ComboStripProps) {
  const each = Math.ceil(width / Math.max(products.length, 1));
  return (
    <div className={`flex overflow-hidden ${className}`}>
      {products.map(({ product, bg }) => (
        <div
          key={product.id}
          className="relative h-full flex-1"
          style={{ backgroundColor: bg }}
        >
          {product.image && (
            <Image
              src={product.image}
              alt=""
              fill
              sizes={`${each * 2}px`}
              className="object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}
