"use client";

import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { useRef } from "react";

type Direction = "left" | "right" | "up" | "down" | "none";

const OFFSET: Record<Direction, { x?: number; y?: number }> = {
  left: { x: -70 },
  right: { x: 70 },
  up: { y: 50 },
  down: { y: -50 },
  none: {},
};

/* ───────── Barra de progreso de scroll (fija arriba) ───────── */
export function ScrollProgress({ color = "#25343F" }: { color?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      className="fixed left-0 top-0 z-50 h-1 w-full origin-left"
      style={{ scaleX, backgroundColor: color }}
    />
  );
}

/* ───────── Contenedor que escalona la entrada de sus hijos ───────── */
export function StaggerContainer({
  children,
  className = "",
  stagger = 0.14,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const variants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: 0.1 } },
  };
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

/* ───────── Elemento hijo del contenedor escalonado ───────── */
export function Item({
  children,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
}) {
  const variants: Variants = {
    hidden: { opacity: 0, ...OFFSET[direction] },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { type: "spring", stiffness: 110, damping: 18, mass: 0.7 },
    },
  };
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

/* ───────── Parallax vertical ligado al scroll ───────── */
export function Parallax({
  children,
  className = "",
  amount = 80,
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-amount, amount]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ───────── Inclinación + escala al pasar el mouse ───────── */
export function Tilt({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.06, rotate: -1.5 }}
      transition={{ type: "spring", stiffness: 250, damping: 15 }}
    >
      {children}
    </motion.div>
  );
}
