"use client";

import { motion } from "motion/react";
import type { ElementType } from "react";
import { STAGGER, inView, maskUp, sequence, useReducedMotion } from "@/lib/motion";

type Props = {
  children: string;
  as?: ElementType;
  /** "word" suits display lines; "line" suits multi-line statements. */
  split?: "word" | "line";
  stagger?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Staggered MASK reveal for display copy. Splits the string, clips each part,
 * and raises them in sequence (§10) rather than fading everything at once.
 *
 * Accessibility: the split is visual only. The full string stays readable to
 * screen readers via aria-label, and the fragments are hidden from the tree.
 */
export function MotionText({
  children,
  as = "span",
  split = "word",
  stagger = STAGGER.base,
  delay = 0,
  className,
  style,
}: Props) {
  const reduced = useReducedMotion();
  const Tag = motion[as as keyof typeof motion] as ElementType;
  const Plain = as as ElementType;

  const parts = split === "line" ? children.split("\n") : children.split(" ");

  if (reduced) {
    return (
      <Plain className={className} style={style}>
        {children}
      </Plain>
    );
  }

  return (
    <Tag
      className={className}
      style={style}
      aria-label={children}
      variants={sequence(stagger, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
    >
      {parts.map((part, i) => (
        <span
          key={`${part}-${i}`}
          className="u-clip"
          aria-hidden="true"
          style={{ display: split === "line" ? "block" : "inline-block" }}
        >
          <motion.span variants={maskUp} style={{ display: "inline-block" }}>
            {part}
            {split === "word" && i < parts.length - 1 ? " " : null}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
