"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useSound } from "@/lib/sound";

type Props = {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
};

/** The site's one link affordance. Icons are used sparingly (§13). */
export function ArrowLink({ href, children, external, className }: Props) {
  const { cue } = useSound();

  const content = (
    <>
      <span>{children}</span>
      <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
    </>
  );

  const shared = {
    className: `jvr-arrowlink ${className ?? ""}`,
    onPointerEnter: () => cue("hover"),
    onPointerDown: () => cue("press"),
  };

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" {...shared}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} {...shared}>
      {content}
    </Link>
  );
}
