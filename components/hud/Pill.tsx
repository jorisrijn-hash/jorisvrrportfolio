"use client";

import { useSound } from "@/lib/sound";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  invert?: boolean;
  current?: boolean;
  disabled?: boolean;
  spinner?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * The reference's one control shape: hairline border, 2px radius, tiny mono.
 * Not a SaaS capsule. [REBUILD] is the single inverted variant.
 *
 * Every state the brief asks for is wired: enter, down, up, current, disabled.
 */
export function Pill({
  children,
  onClick,
  invert,
  current,
  disabled,
  spinner,
  className,
  ...rest
}: Props) {
  const { cue } = useSound();

  return (
    <button
      type="button"
      className={`pill ${invert ? "pill--invert" : ""} ${className ?? ""}`}
      aria-current={current ? "true" : undefined}
      disabled={disabled}
      data-cursor-state="active"
      onPointerEnter={() => !disabled && cue("hover")}
      onPointerDown={() => !disabled && cue("press")}
      onPointerUp={() => !disabled && cue("release")}
      onClick={onClick}
      {...rest}
    >
      {spinner ? <span className="pill__spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
