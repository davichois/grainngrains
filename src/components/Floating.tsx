"use client";

import { motion } from "framer-motion";

/**
 * Hace flotar suavemente su contenido de forma continua (Framer Motion).
 */
export default function Floating({
  children,
  className = "",
  amplitude = 12,
  duration = 5,
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{
        duration,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      {children}
    </motion.div>
  );
}
