"use client";

import { useCallback, useRef, useState } from "react";
import { ShowcaseCategory } from "./types";
import { CATEGORIES } from "./data";
import HeroSlider from "./HeroSlider";
import ProductGrid from "./ProductGrid";

interface ProductShowcaseProps {
  categories?: ShowcaseCategory[];
}

export default function ProductShowcase({
  categories = CATEGORIES,
}: ProductShowcaseProps) {
  const [active, setActive] = useState(0);
  const productsRef = useRef<HTMLElement>(null);

  /* Estable para no re-disparar el efecto de notificación del slider */
  const handleCategoryChange = useCallback((i: number) => setActive(i), []);

  const scrollToProducts = () =>
    productsRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <HeroSlider
        categories={categories}
        onCategoryChange={handleCategoryChange}
        onScrollDown={scrollToProducts}
      />

      <section
        ref={productsRef}
        className="px-0"
      >
        <ProductGrid category={categories[active]} />
      </section>
    </>
  );
}
