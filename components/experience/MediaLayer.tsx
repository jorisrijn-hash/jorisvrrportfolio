"use client";

import { useEffect, useRef } from "react";
import { dev } from "@/lib/dev";
import { useReducedMotion } from "@/lib/motion";

type Props = {
  src: string;
  poster: string;
  visible: boolean;
  loop?: boolean;
  /** Restart from 0 whenever it becomes visible — transitions need this. */
  restartOnShow?: boolean;
  onEnded?: () => void;
  className?: string;
};

/**
 * A reference animation as a media layer.
 *
 * These are the supplied production assets (cropped: the originals are screen
 * recordings and carry a browser scrollbar and cursor). The UI that sits over
 * them is real DOM — only the non-interactive animated content is video.
 *
 * Performance (§31): muted + playsInline so mobile can autoplay, paused when
 * the tab is hidden or the layer is not visible, poster painted underneath so
 * the first frame is never blank, and preload="auto" only once it matters.
 */
export function MediaLayer({
  src,
  poster,
  visible,
  loop = false,
  restartOnShow = false,
  onEnded,
  className,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const still = reduced || dev("REDUCE_MEDIA");

  useEffect(() => {
    const v = ref.current;
    if (!v || still) return;

    if (visible) {
      if (restartOnShow) v.currentTime = 0;
      void v.play().catch(() => {
        /* autoplay refused — the poster still shows the correct frame */
      });
    } else {
      v.pause();
    }
  }, [visible, restartOnShow, still]);

  // Never burn frames on a hidden tab.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onVis = () => {
      if (document.hidden) v.pause();
      else if (visible && !still) void v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [visible, still]);

  return (
    <div className={`media-layer ${className ?? ""}`} data-visible={visible} aria-hidden="true">
      {still ? (
        <img src={poster} alt="" />
      ) : (
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          playsInline
          loop={loop}
          preload="auto"
          onEnded={onEnded}
disablePictureInPicture
        />
      )}
    </div>
  );
}
