"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { StatItem, StatsSectionProps } from "../types";
import parcela from "@/public/images/about/parcela.jpg";

function Counter({
  to,
  suffix = "",
}: {
  to: number | string;
  suffix?: string;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();

        const target = Number(to);
        const t0 = performance.now();
        const dur = 1400;

        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          setVal(Math.floor((1 - Math.pow(1 - p, 4)) * target));
          if (p < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      },
      { threshold: 0.2 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);

  return (
    <span ref={ref} className="tabular-nums">
      {suffix}
      {val}
    </span>
  );
}

function StatCard({ value, suffix, label, hex }: StatItem) {
  const C = 2 * Math.PI * 90;

  return (
    <div className="flex flex-col sm:flex-row md:flex-col items-center md:items-start text-center md:text-left gap-4 sm:gap-6">
      {/* Ring */}
      <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-36 lg:h-36 xl:w-44 xl:h-44">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={hex}
            strokeWidth="6"
            strokeDasharray={C}
            strokeDashoffset={C * 0.25}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
        </svg>
      </div>

      {/* Text */}
      <div>
        <p className="text-3xl sm:text-4xl md:text-5xl xl:text-7xl font-semibold text-white leading-none mb-2">
          <Counter to={value} suffix={suffix} />
        </p>
        <p className="text-xs sm:text-sm md:text-base xl:text-lg text-white/65 leading-snug max-w-xs md:max-w-52 mx-auto md:mx-0">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function StatsSection({
  heading,
  stats,
  backgroundAlt = "",
  overlayOpacity = 0.6,
  className = "",
}: StatsSectionProps) {
  return (
    <section
      className={`relative overflow-hidden px-4 sm:px-6 md:px-10 xl:px-20 py-14 sm:py-16 md:py-20 lg:py-24 ${className}`}
    >
      <Image
        src={parcela}
        alt={backgroundAlt}
        fill
        className="object-cover"
        sizes="100vw"
        aria-hidden={!backgroundAlt}
      />

      <div
        className="absolute inset-0 bg-linear-to-tr from-black via-gray-900 to-transparent"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 sm:mb-12 md:mb-14 lg:mb-16">
          <span
            className="block w-12 sm:w-16 md:w-20 h-px md:h-1 mb-3 md:mb-5 bg-amber-500"
            aria-hidden
          />
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-tight tracking-tight text-white">
            {heading}
          </h2>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
