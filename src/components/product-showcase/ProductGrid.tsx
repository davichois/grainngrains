"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ShowcaseCategory } from "./types";
import ProductCard from "./ProductCard";
import { StaggerContainer, Item } from "@/src/components/motion/Motion";

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
        <StaggerContainer key={`head-${shown.id}`}>
          <Item>
            <h2
              className="text-4xl md:text-5xl font-extrabold uppercase mb-6"
              style={{ color: shown.headingColor ?? "#FFF0B4" }}
            >
              {t(`${shown.id}.name`)}
            </h2>
          </Item>

          <Item>
            <p
              className="text-base md:text-3xl max-w-5xl mx-auto font-light"
              style={{ color: shown.headingColor ?? "#FFF0B4" }}
            >
              {t(`${shown.id}.subtitle`)}
            </p>
          </Item>
        </StaggerContainer>
      </div>

      {/* Grilla */}
      <div
        className="transition-[opacity,transform] duration-200 ease-in-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
        }}
      >
        <StaggerContainer
          key={`grid-${shown.id}`}
          stagger={0.08}
          className="grid grid-cols-3 gap-0 max-[480px]:grid-cols-1"
          style={{ backgroundColor: shown.panelBg ?? "#FFF0B4" }}
        >
          {shown.products.map((p) => (
            <Item key={p.id}>
              <ProductCard
                product={p}
                accent={shown.color}
                name={t(`${shown.id}.products.${p.id}`)}
              />
            </Item>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
}
