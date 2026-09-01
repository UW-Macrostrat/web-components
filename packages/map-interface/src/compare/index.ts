/** A "swipe to compare" view: two synchronized maps, each pinned to the full
 * size of this container and revealed by a draggable divider.
 *
 * The panes are laid out with `allotment`, so the divider is a real split-view
 * sash and the reveal is done by the panes' `overflow: hidden`. That clips hit
 * testing as well as painting, which is what routes pointer events to whichever
 * map is actually visible under the cursor.
 *
 * This takes `MapView`'s props, applies them to both maps, and lets `before`
 * and `after` override them per side -- usually just `style` or
 * `overlayStyles`. The `before` map runs in the enclosing map context (so
 * container-level controls, hash strings and position reporting keep tracking
 * it), while the `after` map gets its own isolated context.
 */
import { Allotment, AllotmentHandle } from "allotment";
import classNames from "classnames";
import type { Map } from "mapbox-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapboxMapProvider,
  useLinkedMapCameras,
  useMapInitialized,
  useMapRef,
} from "@macrostrat/mapbox-react";
import { MapView, MapViewProps } from "../map-view";
import h from "./main.module.sass";
import "allotment/dist/style.css";

export type CompareOrientation = "vertical" | "horizontal";

export interface CompareMapViewProps extends MapViewProps {
  /** Overrides for the map before the divider (left, or top) */
  before?: Partial<MapViewProps>;
  /** Overrides for the map after the divider (right, or bottom) */
  after?: Partial<MapViewProps>;
  /** The orientation of the divider itself */
  orientation?: CompareOrientation;
  /** Divider position, as a fraction (0–1) of the container's width or height.
   * When set, the divider is controlled by this value. */
  sliderPosition?: number;
  /** Called with the divider's fractional position as it moves */
  onSlide?: (position: number) => void;
  /** Called with the divider's fractional position when a drag finishes */
  onSlideEnd?: (position: number) => void;
}

export function CompareMapView(props: CompareMapViewProps) {
  const {
    before,
    after,
    orientation = "vertical",
    sliderPosition,
    onSlide,
    onSlideEnd,
    // `MapView` props that apply to this container rather than to the maps
    standalone = false,
    height,
    width,
    className,
    ...mapProps
  } = props;

  const allotmentRef = useRef<AllotmentHandle>(null);
  const [position, setPosition] = useState(sliderPosition ?? 0.5);

  // The "before" map lives in the enclosing map context
  const beforeMap = useMapElementWhenReady();
  const [afterMap, setAfterMap] = useState<Map | null>(null);
  useLinkedMapCameras(beforeMap, afterMap);

  useEffect(() => {
    /** Track a controlled divider position */
    if (sliderPosition == null) return;
    setDividerPosition(allotmentRef, sliderPosition);
  }, [sliderPosition]);

  const handleChange = useCallback(
    (sizes: number[]) => {
      const fraction = fractionOf(sizes);
      setPosition(fraction);
      onSlide?.(fraction);
    },
    [onSlide],
  );

  const handleDragEnd = useCallback(
    (sizes: number[]) => onSlideEnd?.(fractionOf(sizes)),
    [onSlideEnd],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const delta = keyboardDelta(event, orientation);
      if (delta == 0) return;
      event.preventDefault();
      setDividerPosition(allotmentRef, clamp(position + delta, 0, 1));
    },
    [position, orientation],
  );

  // Each map fills this container and is revealed by its pane, so both are
  // rendered standalone regardless of how the compare view itself is sized.
  const beforeProps = { ...mapProps, ...before, standalone: true };
  const afterProps = { ...mapProps, ...after, standalone: true };

  return h(
    "div.compare-map-view",
    {
      className: classNames(orientation, { standalone }, className),
      style: {
        height,
        width,
        "--compare-position": `${position * 100}%`,
      },
    },
    [
      h(
        Allotment,
        {
          ref: allotmentRef,
          // Our `orientation` describes the divider; allotment's describes the split
          vertical: orientation == "horizontal",
          separator: false,
          defaultSizes: [position, 1 - position],
          onChange: handleChange,
          onDragEnd: handleDragEnd,
        },
        [
          h(
            Allotment.Pane,
            h("div.compare-pane.before", h(MapView, beforeProps)),
          ),
          h(
            Allotment.Pane,
            h(
              "div.compare-pane.after",
              h(MapboxMapProvider, { inherit: false }, [
                h(MapReadyReporter, { onMapReady: setAfterMap }),
                h(MapView, afterProps),
              ]),
            ),
          ),
        ],
      ),
      h("div.compare-handle", {
        role: "separator",
        tabIndex: 0,
        "aria-label": "Map comparison divider",
        "aria-orientation": orientation,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": Math.round(position * 100),
        onKeyDown: handleKeyDown,
      }),
    ],
  );
}

/** Report an isolated context's map object outward once it has been created */
function MapReadyReporter({
  onMapReady,
}: {
  onMapReady(map: Map | null): void;
}) {
  const map = useMapElementWhenReady();
  useEffect(() => {
    onMapReady(map);
  }, [map]);
  return null;
}

function useMapElementWhenReady(): Map | null {
  const mapRef = useMapRef();
  const isInitialized = useMapInitialized();
  if (!isInitialized) return null;
  return mapRef.current;
}

/** Allotment reports pixel sizes; we work in fractions of the container */
function fractionOf(sizes: number[]): number {
  const total = sizes.reduce((a, b) => a + b, 0);
  if (total == 0) return 0.5;
  return sizes[0] / total;
}

function setDividerPosition(
  ref: React.RefObject<AllotmentHandle | null>,
  fraction: number,
) {
  // Allotment normalizes proportionally, so unit sizes are enough here
  ref.current?.resize([fraction, 1 - fraction]);
}

function keyboardDelta(
  event: React.KeyboardEvent,
  orientation: CompareOrientation,
): number {
  const step = event.shiftKey ? 0.1 : 0.02;
  const [back, forward] =
    orientation == "horizontal"
      ? ["ArrowUp", "ArrowDown"]
      : ["ArrowLeft", "ArrowRight"];
  if (event.key == back) return -step;
  if (event.key == forward) return step;
  return 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
