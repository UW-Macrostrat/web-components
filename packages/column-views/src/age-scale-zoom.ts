import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { zoomIdentity, ZoomTransform } from "d3-zoom";
import { easeCubicInOut } from "d3-ease";
import { createCompositeScale } from "./prepare-units";
import type { PackageScaleLayoutData } from "./prepare-units";

/** The minimal shape the zoom driver needs from a composite layout. */
export interface CompositeScaleInfoLike {
  totalHeight: number;
  packages: PackageScaleLayoutData[];
}

export interface UseAgeScaleZoomOptions {
  /** The *base* (identity) scale info — the committed layout. Pixel positions
   * are read from here so repeated zooms compose predictably. */
  baseScaleInfo: CompositeScaleInfoLike | null;
  /** Current transform (controlled by the caller). */
  transform: ZoomTransform;
  /** Called each animation frame with the next transform. */
  onTransformChange: (transform: ZoomTransform) => void;
  /** The scroll container whose `scrollTop` is driven during a zoom. */
  scrollContainerRef: RefObject<HTMLElement | null>;
  duration?: number;
  ease?: (t: number) => number;
}

export interface AgeScaleZoomTarget {
  duration?: number;
}

export interface AgeScaleZoom {
  /** Animate so `[older, younger]` fills the scroll viewport. */
  zoomToAgeRange(ageRange: [number, number], opts?: AgeScaleZoomTarget): void;
  /** Animate to a timescale interval (with buffer), using its `eag`/`lag`. */
  zoomToInterval(
    interval: { eag: number; lag: number },
    opts?: AgeScaleZoomTarget & { bufferFraction?: number; minBuffer?: number },
  ): void;
  /** Animate back to the committed layout (identity transform, top of scroll). */
  reset(opts?: AgeScaleZoomTarget): void;
  isAnimating: boolean;
}

/**
 * Pan-model **A** (scroll + density) driver for the correlation chart's age
 * scale: it animates only the zoom density `k` and keeps the chart's existing
 * scroll container, syncing `scrollTop` so the focused span stays anchored as
 * the content height changes. The transform is the caller's controlled state.
 */
export function useAgeScaleZoom(options: UseAgeScaleZoomOptions): AgeScaleZoom {
  const {
    baseScaleInfo,
    transform,
    onTransformChange,
    scrollContainerRef,
    duration = 750,
    ease = easeCubicInOut,
  } = options;

  const [isAnimating, setIsAnimating] = useState(false);
  const frame = useRef<number | null>(null);

  // While a zoom is in flight, `anchor` is the base pixel that should sit at
  // the top of the viewport; a layout effect re-applies it after each height
  // change. Null when idle, so manual scrolling is never fought.
  const anchor = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (frame.current != null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  }, []);
  useEffect(() => cancel, [cancel]);

  // Keep the focused span pinned as the transformed content height updates.
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (el == null || anchor.current == null) return;
    el.scrollTop = anchor.current * transform.k;
  }, [transform, scrollContainerRef]);

  const basePixel = useCallback(
    (age: number): number | null => {
      if (baseScaleInfo == null) return null;
      const composite = createCompositeScale(
        baseScaleInfo.packages.map((p) => ({ scaleInfo: p })) as any,
        true,
      );
      return composite(age);
    },
    [baseScaleInfo],
  );

  const animateToK = useCallback(
    (kTarget: number, anchorBasePixel: number | null, animDuration: number) => {
      cancel();
      const kFrom = transform.k;
      anchor.current = anchorBasePixel;

      if (animDuration <= 0 || kFrom === kTarget) {
        onTransformChange(zoomIdentity.scale(kTarget));
        setIsAnimating(false);
        return;
      }

      setIsAnimating(true);
      let start: number | null = null;
      const step = (now: number) => {
        if (start == null) start = now;
        const t = Math.min((now - start) / animDuration, 1);
        const k = kFrom + (kTarget - kFrom) * ease(t);
        onTransformChange(zoomIdentity.scale(k));
        if (t < 1) {
          frame.current = requestAnimationFrame(step);
        } else {
          frame.current = null;
          setIsAnimating(false);
          if (kTarget === 1) anchor.current = null;
        }
      };
      frame.current = requestAnimationFrame(step);
    },
    [cancel, ease, onTransformChange, transform.k],
  );

  const zoomToAgeRange = useCallback(
    (ageRange: [number, number], opts: AgeScaleZoomTarget = {}) => {
      const el = scrollContainerRef.current;
      const p0 = basePixel(ageRange[0]);
      const p1 = basePixel(ageRange[1]);
      if (el == null || p0 == null || p1 == null) return;
      const top = Math.min(p0, p1);
      const span = Math.abs(p1 - p0);
      if (span === 0) return;
      const kTarget = el.clientHeight / span;
      if (!isFinite(kTarget) || kTarget <= 0) return;
      animateToK(kTarget, top, opts.duration ?? duration);
    },
    [animateToK, basePixel, duration, scrollContainerRef],
  );

  const zoomToInterval = useCallback(
    (
      interval: { eag: number; lag: number },
      opts: AgeScaleZoomTarget & {
        bufferFraction?: number;
        minBuffer?: number;
      } = {},
    ) => {
      const { bufferFraction = 0.25, minBuffer = 5 } = opts;
      const buffer = Math.max((interval.eag - interval.lag) * bufferFraction, minBuffer);
      zoomToAgeRange([interval.eag + buffer, interval.lag - buffer], opts);
    },
    [zoomToAgeRange],
  );

  const reset = useCallback(
    (opts: AgeScaleZoomTarget = {}) => {
      // Anchor to the top (scrollTop → 0) as we ease back to the committed layout.
      animateToK(1, 0, opts.duration ?? duration);
    },
    [animateToK, duration],
  );

  return { zoomToAgeRange, zoomToInterval, reset, isAnimating };
}
