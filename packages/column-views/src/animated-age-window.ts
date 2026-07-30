import { useCallback, useEffect, useRef, useState } from "react";

/** A rendered age window, ordered as the column props expect:
 * `t_age` is the younger (top) bound, `b_age` the older (bottom) bound. */
export interface AgeWindow {
  t_age: number;
  b_age: number;
}

export interface AnimateWindowOptions {
  duration?: number;
}

export interface UseAnimatedAgeWindowOptions {
  /** The full data extent — the window to reset to, and the initial window.
   * `null` until the data (and hence extent) is known. */
  fullExtent: AgeWindow | null;
  /** Animation duration in ms (default 750). */
  duration?: number;
}

export interface AnimatedAgeWindow {
  /** The current animated window to feed to `t_age`/`b_age` column props
   * (`null` until `fullExtent` is known). */
  window: AgeWindow | null;
  isAnimating: boolean;
  /** True when the window is (approximately) the full extent. */
  isFullExtent: boolean;
  /** Pan-and-contract to an explicit window (clamped to the full extent).
   * Density (`pixelScale`) is left untouched — this is not a zoom. */
  zoomToWindow(target: AgeWindow, opts?: AnimateWindowOptions): void;
  /** Pan-and-contract to a timescale interval (with buffer), using `eag`/`lag`. */
  zoomToInterval(
    interval: { eag: number; lag: number },
    opts?: AnimateWindowOptions & { bufferFraction?: number; minBuffer?: number },
  ): void;
  /** Ease back to the full extent. */
  reset(opts?: AnimateWindowOptions): void;
}

/**
 * Animate the rendered age window (`t_age`/`b_age`) of a column or correlation
 * chart. This is the "animate the current zoom approach" model: narrowing the
 * window re-lays-out the column with explicit clipping — units past the bounds
 * get a zig-zag edge, unconformities keep their fixed `unconformityHeight`, and
 * `pixelScale` (density) is untouched, so a sub-interval click **pans and
 * contracts** at constant density rather than zooming. Joint domain/range
 * change (true zoom) stays under the user's direct control via `pixelScale`.
 */
export function useAnimatedAgeWindow(
  options: UseAnimatedAgeWindowOptions,
): AnimatedAgeWindow {
  const { fullExtent, duration = 750 } = options;

  const [window, setWindow] = useState<AgeWindow | null>(fullExtent);
  const [isAnimating, setIsAnimating] = useState(false);
  const frame = useRef<number | null>(null);
  const windowRef = useRef<AgeWindow | null>(window);
  windowRef.current = window;

  const cancel = useCallback(() => {
    if (frame.current != null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  }, []);
  useEffect(() => cancel, [cancel]);

  // Snap to a new full extent when the underlying data changes.
  const extentKey = fullExtent ? `${fullExtent.t_age},${fullExtent.b_age}` : null;
  useEffect(() => {
    cancel();
    setIsAnimating(false);
    setWindow(fullExtent);
  }, [extentKey]);

  const animateTo = useCallback(
    (target: AgeWindow, animDuration: number) => {
      cancel();
      const from = windowRef.current ?? target;

      if (animDuration <= 0) {
        setWindow(target);
        setIsAnimating(false);
        return;
      }

      setIsAnimating(true);
      let start: number | null = null;
      const step = (now: number) => {
        if (start == null) start = now;
        const t = Math.min((now - start) / animDuration, 1);
        const e = easeCubicInOut(t);
        setWindow({
          t_age: lerp(from.t_age, target.t_age, e),
          b_age: lerp(from.b_age, target.b_age, e),
        });
        if (t < 1) {
          frame.current = requestAnimationFrame(step);
        } else {
          frame.current = null;
          setIsAnimating(false);
        }
      };
      frame.current = requestAnimationFrame(step);
    },
    [cancel],
  );

  const zoomToWindow = useCallback(
    (target: AgeWindow, opts: AnimateWindowOptions = {}) => {
      animateTo(clampWindow(target, fullExtent), opts.duration ?? duration);
    },
    [animateTo, duration, fullExtent],
  );

  const zoomToInterval = useCallback(
    (
      interval: { eag: number; lag: number },
      opts: AnimateWindowOptions & {
        bufferFraction?: number;
        minBuffer?: number;
      } = {},
    ) => {
      const { bufferFraction = 0.25, minBuffer = 5 } = opts;
      const buffer = Math.max(
        (interval.eag - interval.lag) * bufferFraction,
        minBuffer,
      );
      zoomToWindow(
        { t_age: interval.lag - buffer, b_age: interval.eag + buffer },
        opts,
      );
    },
    [zoomToWindow],
  );

  const reset = useCallback(
    (opts: AnimateWindowOptions = {}) => {
      if (fullExtent == null) return;
      animateTo(fullExtent, opts.duration ?? duration);
    },
    [animateTo, duration, fullExtent],
  );

  const isFullExtent =
    window == null ||
    fullExtent == null ||
    (approxEqual(window.t_age, fullExtent.t_age) &&
      approxEqual(window.b_age, fullExtent.b_age));

  return { window, isAnimating, isFullExtent, zoomToWindow, zoomToInterval, reset };
}

function clampWindow(target: AgeWindow, extent: AgeWindow | null): AgeWindow {
  if (extent == null) return target;
  return {
    t_age: Math.max(target.t_age, extent.t_age),
    b_age: Math.min(target.b_age, extent.b_age),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeCubicInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function approxEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}
