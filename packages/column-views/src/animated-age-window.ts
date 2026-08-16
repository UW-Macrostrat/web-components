import { useCallback, useMemo } from "react";
import { AgeDomain, useAnimatedDomain } from "@macrostrat/timescale";

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
  /** Pan-and-contract to a timescale interval, using `eag`/`lag`. */
  zoomToInterval(
    interval: { eag: number; lag: number },
    opts?: AnimateWindowOptions,
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
 *
 * The animation itself is `useAnimatedDomain` from `@macrostrat/timescale` —
 * the same state machine that drives the timescale's `useZoomableScale`. This
 * hook only maps an `[older, younger]` domain onto `{ b_age, t_age }`; it
 * animates the window you ask for and nothing more. Revealing a margin of the
 * neighboring column is the *layout's* job, via the `windowPadding` prop (px),
 * which is resolved against real section heights rather than predicted here.
 */
export function useAnimatedAgeWindow(
  options: UseAnimatedAgeWindowOptions,
): AnimatedAgeWindow {
  const { fullExtent, duration } = options;

  const extent = useMemo(() => toDomain(fullExtent), [
    fullExtent?.t_age,
    fullExtent?.b_age,
  ]);

  const anim = useAnimatedDomain({ extent, duration });

  const zoomToWindow = useCallback(
    (target: AgeWindow, opts: AnimateWindowOptions = {}) => {
      anim.animateTo([target.b_age, target.t_age], {
        duration: opts.duration,
      });
    },
    [anim.animateTo],
  );

  const zoomToInterval = useCallback(
    (
      interval: { eag: number; lag: number },
      opts: AnimateWindowOptions = {},
    ) => {
      zoomToWindow({ t_age: interval.lag, b_age: interval.eag }, opts);
    },
    [zoomToWindow],
  );

  const reset = useCallback(
    (opts: AnimateWindowOptions = {}) => {
      if (fullExtent == null) return;
      zoomToWindow(fullExtent, opts);
    },
    [zoomToWindow, fullExtent?.t_age, fullExtent?.b_age],
  );

  return {
    window: toWindow(anim.domain),
    isAnimating: anim.isAnimating,
    isFullExtent: anim.isFullExtent,
    zoomToWindow,
    zoomToInterval,
    reset,
  };
}

/** `{t_age, b_age}` ↔ the core's `[older, younger]` domain. */
function toDomain(w: AgeWindow): AgeDomain;
function toDomain(w: AgeWindow | null): AgeDomain | null;
function toDomain(w: AgeWindow | null): AgeDomain | null {
  if (w == null) return null;
  return [w.b_age, w.t_age];
}

function toWindow(d: AgeDomain): AgeWindow;
function toWindow(d: AgeDomain | null): AgeWindow | null;
function toWindow(d: AgeDomain | null): AgeWindow | null {
  if (d == null) return null;
  return { t_age: d[1], b_age: d[0] };
}
