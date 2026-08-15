import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScaleContinuousNumeric } from "d3-scale";
import { zoomIdentity, ZoomTransform } from "d3-zoom";
import { interpolate } from "d3-interpolate";
import { easeCubicInOut } from "d3-ease";

/** A visible time span, ordered [older, younger] to match the timescale's
 * `eag`/`lag` and the `Interval` shape. */
export type AgeDomain = [number, number];

export interface UseZoomableScaleOptions {
  /** Default animation duration (ms) for programmatic zooms. */
  duration?: number;
  /** Easing applied to the animated domain. Defaults to cubic in-out. */
  ease?: (t: number) => number;
  /** Default padding, in **pixels**, held around every zoom target so
   * neighboring time stays reachable. See {@link padDomain}. */
  padding?: number;
}

export interface ZoomToDomainOptions {
  duration?: number;
  /** Padding in pixels around the target span (overrides the hook default). */
  padding?: number;
}

export type ZoomToIntervalOptions = ZoomToDomainOptions;

export interface ZoomableScale {
  /** The rescaled scale to hand to `<Timescale scale=... />`. */
  scale: ScaleContinuousNumeric<number, number>;
  /** The canonical zoom transform (gesture-ready source of truth). */
  transform: ZoomTransform;
  /** The currently visible domain, ordered [older, younger]. */
  domain: AgeDomain;
  /** True when showing the full base extent (identity transform). */
  isFullExtent: boolean;
  /** True while an animation is in flight. */
  isAnimating: boolean;
  /** Animate to an explicit [older, younger] span, plus padding. */
  zoomToDomain(domain: AgeDomain, opts?: ZoomToDomainOptions): void;
  /** Animate to a timescale interval, using its eag/lag. */
  zoomToInterval(
    interval: { eag: number; lag: number },
    opts?: ZoomToIntervalOptions,
  ): void;
  /** Animate back to the full base extent. */
  reset(opts?: ZoomToDomainOptions): void;
  /** Set the transform directly (no animation) — for future gesture wiring. */
  setTransform(transform: ZoomTransform): void;
}

/**
 * Drive a timescale's scale from a single `d3` zoom transform so that changing
 * the visible age span animates a zoom/pan rather than snapping.
 *
 * The transform is the canonical state (ready to accept `d3-zoom` gestures
 * later); the visible scale is derived via `transform.rescaleY(baseScale)`, and
 * programmatic targets animate by easing the *visible domain* frame-to-frame.
 */
export function useZoomableScale(
  baseScale: ScaleContinuousNumeric<number, number>,
  options: UseZoomableScaleOptions = {},
): ZoomableScale {
  const {
    duration = 750,
    ease = easeCubicInOut,
    padding: defaultPadding = 0,
  } = options;

  // Keep a private copy so we never mutate the caller's scale, and reset the
  // transform if the base extent itself changes.
  const base = useMemo(
    () => baseScale.copy(),
    [baseScale.domain().join(","), baseScale.range().join(",")],
  );

  const [transform, setTransformState] = useState<ZoomTransform>(zoomIdentity);
  const [isAnimating, setIsAnimating] = useState(false);

  // rAF bookkeeping, kept out of render state.
  const frame = useRef<number | null>(null);
  const cancelAnimation = useCallback(() => {
    if (frame.current != null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  }, []);

  useEffect(() => cancelAnimation, [cancelAnimation]);

  // Read the latest transform inside the rAF loop without re-creating it.
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const setTransform = useCallback(
    (t: ZoomTransform) => {
      cancelAnimation();
      setIsAnimating(false);
      setTransformState(t);
    },
    [cancelAnimation],
  );

  const animateToDomain = useCallback(
    (rawTarget: AgeDomain, animDuration: number, padding: number) => {
      cancelAnimation();
      const target = padDomain(base, rawTarget, padding);
      const targetTransform = transformForDomain(base, target);
      if (targetTransform == null) return;

      if (animDuration <= 0) {
        setIsAnimating(false);
        setTransformState(targetTransform);
        return;
      }

      const from = currentDomain(base, transformRef.current);
      const interpolator = interpolate(from, target);
      setIsAnimating(true);

      let start: number | null = null;
      const step = (now: number) => {
        if (start == null) start = now;
        const t = Math.min((now - start) / animDuration, 1);
        const eased = ease(t);
        const d = interpolator(eased) as AgeDomain;
        const next = transformForDomain(base, d);
        if (next != null) setTransformState(next);
        if (t < 1) {
          frame.current = requestAnimationFrame(step);
        } else {
          frame.current = null;
          setIsAnimating(false);
        }
      };
      frame.current = requestAnimationFrame(step);
    },
    [base, cancelAnimation, ease],
  );

  const zoomToDomain = useCallback(
    (domain: AgeDomain, opts: ZoomToDomainOptions = {}) => {
      animateToDomain(
        domain,
        opts.duration ?? duration,
        opts.padding ?? defaultPadding,
      );
    },
    [animateToDomain, duration, defaultPadding],
  );

  const zoomToInterval = useCallback(
    (
      interval: { eag: number; lag: number },
      opts: ZoomToIntervalOptions = {},
    ) => {
      zoomToDomain([interval.eag, interval.lag], opts);
    },
    [zoomToDomain],
  );

  const reset = useCallback(
    (opts: ZoomToDomainOptions = {}) => {
      // Padding collapses at both ends of the full extent, so this lands
      // exactly on the identity transform.
      animateToDomain(
        extentDomain(base),
        opts.duration ?? duration,
        opts.padding ?? defaultPadding,
      );
    },
    [animateToDomain, base, duration, defaultPadding],
  );

  const scale = useMemo(
    () => transform.rescaleY(base),
    [transform, base],
  );
  const domain = currentDomain(base, transform);

  return {
    scale,
    transform,
    domain,
    isFullExtent: transform.k === 1 && transform.y === 0,
    isAnimating,
    zoomToDomain,
    zoomToInterval,
    reset,
    setTransform,
  };
}

/**
 * Expand `[older, younger]` so that, once zoomed to, the span sits `padding`
 * **pixels** inside each end of the base scale's range.
 *
 * Padding is a layout quantity, so it's specified in pixels rather than Myr:
 * the visual gutter around a target is then identical at every zoom level,
 * whereas a fixed Myr padding is invisible when zoomed out and dominant when
 * zoomed in.
 *
 * Padding **collapses** against the ends of the base extent: a span that
 * reaches the oldest (or youngest) representable age gets no padding on that
 * side, and the full pixel padding is still honored on the free side. A span
 * pinned at both ends is exactly the full extent.
 */
export function padDomain(
  base: ScaleContinuousNumeric<number, number>,
  domain: AgeDomain,
  padding: number,
): AgeDomain {
  const [fullOld, fullYoung] = extentDomain(base);
  const clamp = (v: number) => Math.min(Math.max(v, fullYoung), fullOld);
  const older = clamp(domain[0]);
  const younger = clamp(domain[1]);

  const width = rangeWidth(base);
  const f = padding / width;
  // Nothing to do for a non-positive padding, or one too large to fit.
  if (!(f > 0) || 2 * f >= 1) return [older, younger];

  // Unconstrained: the span fills the range minus a gutter at each end.
  const unit = (older - younger) / (width - 2 * padding);
  let paddedOld = older + padding * unit;
  let paddedYoung = younger - padding * unit;

  const oldPinned = paddedOld > fullOld;
  const youngPinned = paddedYoung < fullYoung;

  if (oldPinned && youngPinned) return [fullOld, fullYoung];
  if (oldPinned) {
    // Collapse the old-side gutter and re-solve the young side against the
    // pinned end, so it still measures `padding` pixels.
    paddedOld = fullOld;
    paddedYoung = Math.max((younger - f * paddedOld) / (1 - f), fullYoung);
  } else if (youngPinned) {
    paddedYoung = fullYoung;
    paddedOld = Math.min((older - f * paddedYoung) / (1 - f), fullOld);
  }

  return [paddedOld, paddedYoung];
}

/** Pixel length of the base scale's range. */
function rangeWidth(base: ScaleContinuousNumeric<number, number>): number {
  const r = base.range() as number[];
  return Math.abs(r[r.length - 1] - r[0]);
}

/** The base scale's full domain, ordered [older, younger]. */
function extentDomain(base: ScaleContinuousNumeric<number, number>): AgeDomain {
  const d = base.domain() as number[];
  return [Math.max(d[0], d[d.length - 1]), Math.min(d[0], d[d.length - 1])];
}

/** The visible domain under a transform, ordered [older, younger]. */
function currentDomain(
  base: ScaleContinuousNumeric<number, number>,
  transform: ZoomTransform,
): AgeDomain {
  const d = transform.rescaleY(base).domain() as number[];
  return [Math.max(d[0], d[d.length - 1]), Math.min(d[0], d[d.length - 1])];
}

/**
 * Build the `d3` zoom transform that makes `[older, younger]` fill the base
 * scale's full pixel range, i.e. `transform.rescaleY(base).domain() === domain`.
 * Returns null for a degenerate (zero-width) domain.
 */
export function transformForDomain(
  base: ScaleContinuousNumeric<number, number>,
  domain: AgeDomain,
): ZoomTransform | null {
  const [older, younger] = domain;
  const pOld = base(older);
  const pYoung = base(younger);
  if (pOld === pYoung) return null;

  const range = base.range() as number[];
  const r0 = range[0];
  const r1 = range[range.length - 1];

  const k = (r0 - r1) / (pOld - pYoung);
  if (!isFinite(k) || k <= 0) return null;
  const ty = r0 - k * pOld;

  return zoomIdentity.translate(0, ty).scale(k);
}
