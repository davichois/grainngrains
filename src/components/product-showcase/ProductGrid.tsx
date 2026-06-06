"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ShowcaseCategory } from "./types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  category: ShowcaseCategory;
}

export default function ProductGrid({ category }: ProductGridProps) {
  const t = useTranslations("editions");
  /* Fundido al cambiar de categoría */
  const [shown, setShown] = useState(category);
  const [pending, setPending] = useState<ShowcaseCategory | null>(null);
  const [visible, setVisible] = useState(true);

  /* Cambió la prop: iniciar el fundido de salida durante el render */
  if (category !== shown && category !== pending) {
    setPending(category);
    setVisible(false);
  }

  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => {
      setShown(pending);
      setPending(null);
      setVisible(true);
    }, 200);
    return () => clearTimeout(id);
  }, [pending]);

  return (
    <div>
      {/* Encabezado dinámico */}
      <div
        className="py-24 px-10 text-center shadow-lg"
        style={{ backgroundColor: shown.panelBg }}
      >
        <h2
          className="text-4xl md:text-5xl font-extrabold uppercase mb-6"
          style={{ color: shown.headingColor ?? "#FFF0B4" }}
        >
          {t(`${shown.id}.name`)}
        </h2>

        <p
          className="text-base md:text-3xl max-w-5xl mx-auto font-light"
          style={{ color: shown.headingColor ?? "#FFF0B4" }}
        >
          {t(`${shown.id}.subtitle`)}
        </p>
      </div>

      {/* Grilla */}
      <div
        className="grid grid-cols-3 gap-0 transition-[opacity,transform] duration-200 ease-in-out max-[480px]:grid-cols-1"
        style={{
          opacity: visible ? 1 : 0,
          backgroundColor: shown.panelBg ?? "#FFF0B4",
          transform: visible ? "translateY(0)" : "translateY(16px)",
        }}
      >
        {shown.products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            accent={shown.color}
            name={t(`${shown.id}.products.${p.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
