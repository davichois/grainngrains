"use client";

import { motion, type Variants } from "framer-motion";

type Direction = "left" | "right" | "up" | "down" | "none";

const OFFSET: Record<Direction, { x?: number; y?: number }> = {
  left: { x: -80 },
  right: { x: 80 },
  up: { y: 60 },
  down: { y: -60 },
  none: {},
};

/**
 * Revela su contenido con una animación al entrar en el viewport (Framer Motion).
 */
export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}) {
  const variants: Variants = {
    hidden: { opacity: 0, ...OFFSET[direction] },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 90,
        damping: 18,
        mass: 0.8,
        delay: delay / 1000,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
