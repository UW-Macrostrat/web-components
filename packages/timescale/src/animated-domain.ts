import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { easeCubicInOut } from "d3-ease";

/** A visible time span, ordered [older, younger] to match the timescale's
 * `eag`/`lag` and the `Interval` shape. */
export type AgeDomain = [number, number];

/** Prepares a requested target span before it is animated to: padding,
 * snapping to content, or any other consumer-specific geometry. Receives the
 * target already clamped to `extent`; its result is clamped again. */
export type PrepareDomain = (target: AgeDomain, extent: AgeDomain) => AgeDomain;

export interface UseAnimatedDomainOptions {
  /** The full extent to clamp against and reset to. `null` until it's known
   * (e.g. while data loads); the animated domain is then `null` too. */
  extent: AgeDomain | null;
  /** Default animation duration (ms). */
  duration?: number;
  /** Easing applied to the animated domain. Defaults to cubic in-out. */
  ease?: (t: number) => number;
  /** Default target preparation (padding etc.) for every animation. */
  prepareTarget?: PrepareDomain;
}

export interface AnimateDomainOptions {
  duration?: number;
  /** Overrides the hook-level `prepareTarget` for this animation. */
  prepareTarget?: PrepareDomain;
}

export interface AnimatedDomain {
  /** The currently visible span, ordered [older, younger]. */
  domain: AgeDomain | null;
  /** The full extent, as supplied. */
  extent: AgeDomain | null;
  /** True while an animation is in flight. */
  isAnimating: boolean;
  /** True when the visible span is (approximately) the full extent. */
  isFullExtent: boolean;
  /** Animate to an explicit [older, younger] span. */
  animateTo(target: AgeDomain, opts?: AnimateDomainOptions): void;
  /** Animate to a timescale interval, using its `eag`/`lag`. */
  animateToInterval(
    interval: { eag: number; lag: number },
    opts?: AnimateDomainOptions,
  ): void;
  /** Animate back to the full extent. */
  reset(opts?: AnimateDomainOptions): void;
  /** Jump to a span without animating — for gesture wiring. */
  setDomain(domain: AgeDomain): void;
}

/**
 * The shared animation core for age-scale navigation: an eased, `rAF`-driven
 * traversal of a visible [older, younger] span within a full extent.
 *
 * This is deliberately representation-free — it knows nothing about pixels,
 * transforms, or column layout — so that every animated age scale runs the same
 * state machine. Consumers layer their own geometry on top:
 *
 * - `useZoomableScale` (this package) derives a `d3` zoom transform and a
 *   rescaled scale from the domain, and pads targets in pixel space.
 * - `useAnimatedAgeWindow` (`@macrostrat/column-views`) maps the domain onto
 *   `t_age`/`b_age` column props, which re-lay-out at constant density.
 */
export function useAnimatedDomain(
  options: UseAnimatedDomainOptions,
): AnimatedDomain {
  const {
    extent,
    duration = 750,
    ease = easeCubicInOut,
    prepareTarget,
  } = options;

  const [domain, setDomainState] = useState<AgeDomain | null>(extent);

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

  // Read the latest domain inside the rAF loop without re-creating it.
  const domainRef = useRef(domain);
  domainRef.current = domain;

  const setDomain = useCallback(
    (next: AgeDomain) => {
      cancelAnimation();
      setIsAnimating(false);
      setDomainState(extent == null ? next : clampDomain(next, extent));
    },
    [cancelAnimation, extentKey(extent)],
  );

  // Snap to the extent whenever the extent itself changes (new data, resize).
  const key = extentKey(extent);
  useEffect(() => {
    cancelAnimation();
    setIsAnimating(false);
    setDomainState(extent);
  }, [key]);

  const animateTo = useCallback(
    (target: AgeDomain, opts: AnimateDomainOptions = {}) => {
      if (extent == null) return;
      cancelAnimation();

      const prepare = opts.prepareTarget ?? prepareTarget;
      let next = clampDomain(target, extent);
      if (prepare != null) next = clampDomain(prepare(next, extent), extent);

      const animDuration = opts.duration ?? duration;
      const from = domainRef.current;
      if (from == null || animDuration <= 0) {
        setIsAnimating(false);
        setDomainState(next);
        return;
      }

      setIsAnimating(true);

      let start: number | null = null;
      const step = (now: number) => {
        if (start == null) start = now;
        const t = Math.min((now - start) / animDuration, 1);
        const e = ease(t);
        // Interpolate the bounds directly and emit a *fresh* array each frame.
        // (`d3-interpolate`'s array interpolator returns one cached, mutated
        // array, so React would see an unchanged reference and skip the frame.)
        setDomainState([lerp(from[0], next[0], e), lerp(from[1], next[1], e)]);
        if (t < 1) {
          frame.current = requestAnimationFrame(step);
        } else {
          frame.current = null;
          setIsAnimating(false);
        }
      };
      frame.current = requestAnimationFrame(step);
    },
    [cancelAnimation, key, duration, ease, prepareTarget],
  );

  const animateToInterval = useCallback(
    (
      interval: { eag: number; lag: number },
      opts: AnimateDomainOptions = {},
    ) => {
      animateTo([interval.eag, interval.lag], opts);
    },
    [animateTo],
  );

  const reset = useCallback(
    (opts: AnimateDomainOptions = {}) => {
      if (extent == null) return;
      animateTo(extent, opts);
    },
    [animateTo, key],
  );

  const isFullExtent = useMemo(
    () => domain == null || extent == null || domainsEqual(domain, extent),
    [domain, extent],
  );

  return {
    domain,
    extent,
    isAnimating,
    isFullExtent,
    animateTo,
    animateToInterval,
    reset,
    setDomain,
  };
}

/** Restrict a span to the extent, preserving [older, younger] order. */
export function clampDomain(
  domain: AgeDomain,
  extent: AgeDomain,
): AgeDomain {
  const [fullOld, fullYoung] = extent;
  const clamp = (v: number) => Math.min(Math.max(v, fullYoung), fullOld);
  return [clamp(domain[0]), clamp(domain[1])];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function domainsEqual(a: AgeDomain, b: AgeDomain, eps = 1e-6): boolean {
  return Math.abs(a[0] - b[0]) <= eps && Math.abs(a[1] - b[1]) <= eps;
}

/** A stable dependency key for a nullable extent. */
function extentKey(extent: AgeDomain | null): string | null {
  if (extent == null) return null;
  return `${extent[0]},${extent[1]}`;
}
