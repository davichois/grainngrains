"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CategoryCarouselProps } from "../types";
import { Link } from "../i18n/navigation";

const shapeClass: Record<
  NonNullable<CategoryCarouselProps["imageShape"]>,
  string
> = {
  circle: "rounded-full",
  rounded: "rounded-2xl",
  square: "rounded-none",
};

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const posClass = direction === "left" ? "-left-4" : "-right-4";
  const pathD = direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7";

  return (
    <button
      onClick={onClick}
      aria-label={direction === "left" ? "Previous" : "Next"}
      disabled={disabled}
      className={`
        cursor-pointer
        absolute ${posClass} top-1/2 -translate-y-1/2 z-10
        hidden sm:flex items-center justify-center
        w-9 h-9 rounded-full bg-white 
        hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition
      `}
    >
      <svg
        className="w-4 h-4 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={pathD}
        />
      </svg>
    </button>
  );
}

export default function CategoryCarousel({
  items,
  itemWidth = {},
  scrollStep = 300,
  openInNewTab = false,
  className = "",
  imageShape = "circle",
  imageSizes = "(max-width: 640px) 160px, (max-width: 768px) 192px, 224px",
}: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { base = "w-40", sm = "w-48", md = "w-56" } = itemWidth;

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // Mide al montar, al redimensionar y cuando cambian los items
  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;

    window.addEventListener("resize", updateScrollButtons);
    const observer = new ResizeObserver(updateScrollButtons);
    observer.observe(el);

    return () => {
      window.removeEventListener("resize", updateScrollButtons);
      observer.disconnect();
    };
  }, [updateScrollButtons, items]);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -scrollStep : scrollStep,
      behavior: "smooth",
    });
    setTimeout(updateScrollButtons, 350);
  };

  return (
    <section className={`w-full py-8 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="relative max-w-6xl mx-auto flex justify-center">
        {/* Difuminado izquierdo (aparece cuando se puede desplazar a la izquierda) */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-linear-to-r from-white to-transparent" />
        )}
        {/* Difuminado derecho (aparece cuando se puede desplazar a la derecha) */}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-linear-to-l from-white to-transparent" />
        )}

        <ArrowButton
          direction="left"
          disabled={!canScrollLeft}
          onClick={() => scroll("left")}
        />

        {/* Track */}
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 sm:pb-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <Link
              key={`${item.href}-${item.name}`}
              href="#"
              target={openInNewTab ? "_blank" : undefined}
              rel={openInNewTab ? "noopener noreferrer" : undefined}
              className={`
                shrink-0 snap-start flex flex-col items-center gap-3
                ${base} sm:${sm} md:${md} group
              `}
            >
              <div
                className={`
                  w-full aspect-square relative overflow-hidden bg-gray-50
                  ${shapeClass[imageShape]}
                `}
              >
                <Image
                  src={item.image}
                  alt={item.alt ?? item.name}
                  fill
                  sizes={imageSizes}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h2 className="text-sm uppercase sm:text-base font-semibold text-cyan-900 text-center">
                {item.name}
              </h2>
            </Link>
          ))}
        </div>

        <ArrowButton
          direction="right"
          disabled={!canScrollRight}
          onClick={() => scroll("right")}
        />
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
