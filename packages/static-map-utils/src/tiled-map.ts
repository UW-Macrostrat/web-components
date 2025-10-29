import maplibre, { PaddingOptions } from "maplibre-gl";
import { SphericalMercator } from "@mapbox/sphericalmercator";
import { setupStyleImageManager } from "./style-images";
import { StrictPadding } from "@macrostrat/ui-components";
import { ReactNode, useEffect, useRef } from "react";
import hyper from "@macrostrat/hyper";
import styles from "./tiled-map.module.sass";
import { bbox } from "@turf/bbox";
import { distance } from "@turf/distance";

const h = hyper.styled(styles);

const mercator = new SphericalMercator({
  size: 256,
  antimeridian: true,
});

function lngLatBounds(bounds: MercatorBBox): maplibre.LngLatBoundsLike {
  const sw = mercator.inverse([bounds[0], bounds[1]]);
  const ne = mercator.inverse([bounds[2], bounds[3]]);
  return [sw, ne];
}

export function mercatorBBox(
  lngLatBounds: [number, number, number, number],
): MercatorBBox {
  const sw = mercator.forward([lngLatBounds[0], lngLatBounds[1]]);
  const ne = mercator.forward([lngLatBounds[2], lngLatBounds[3]]);
  return [sw[0], sw[1], ne[0], ne[1]];
}

interface TileBoundsResult {
  tiles: MapTile[];
  pixelSize: {
    width: number;
    height: number;
  };
  innerSize: {
    width: number;
    height: number;
  };
  padding: Padding;
  innerBounds: MercatorBBox;
  bounds: MercatorBBox;
  metersPerPixel: number;
}

interface TileComputationOptions {
  metersPerPixel?: number;
  tileSize?: number;
  padding?: PaddingOptions | number;
}

export type MercatorBBox = [number, number, number, number];

interface MapTile {
  bounds: MercatorBBox;
  pixelSize: {
    width: number;
    height: number;
  };
  pixelOffset: {
    top: number;
    left: number;
  };
}

type TiledMapAreaProps = {
  tileBounds: TileBoundsResult;
  style: maplibre.StyleSpecification;
  height?: number;
  width?: number;
  className?: string;
  children?: ReactNode;
  initializeMap?: MapInitFunction;
  internalScaleFactor?: number;
} & Partial<StrictPadding>;

export function TiledMapArea({
  tileBounds,
  style,
  width,
  height,
  paddingTop = 0,
  paddingLeft = 0,
  className,
  children,
  initializeMap,
  internalScaleFactor = 1,
}: TiledMapAreaProps) {
  const ref = useRef<HTMLDivElement>();

  const { pixelSize } = tileBounds;

  // Not sure why this is needed, really, but it prevents double rendering
  const renderCounter = useRef(0);
  useEffect(() => {
    /** Manager to update map style */
    if (ref.current == null) return;
    renderCounter.current += 1;
    if (renderCounter.current > 1) return;
    // Compute tiled bounds

    renderTiledMap(ref.current, tileBounds, style, initializeMap, {
      internalScaleFactor,
    }).then(() => {});
  }, [ref.current, tileBounds, style, initializeMap, internalScaleFactor]);

  const _width = (width ?? pixelSize.width) + "px";
  const _height = (height ?? pixelSize.height) + "px";

  return h(
    "div.map-view-container.tiled-map",
    {
      className,
      style: {
        width: _width,
        height: _height,
        "--outer-width": _width,
        "--outer-height": _height,
        "--padding-top": paddingTop + "px",
        "--padding-left": paddingLeft + "px",
        "--padding-right": width - pixelSize.width - paddingLeft + "px",
        "--padding-bottom": height - pixelSize.height - paddingTop + "px",
        "--inner-height": pixelSize.height + "px",
        "--inner-width": pixelSize.width + "px",
      },
    },
    [
      h("div.mapbox-map.map-view", {
        ref,
      }),
      children,
    ],
  );
}

type MapInitFunction = (mapOptions: maplibre.MapOptions) => maplibre.Map;

function defaultInitializeMap(mapOptions: maplibre.MapOptions): maplibre.Map {
  const map = new maplibre.Map(mapOptions);
  setupStyleImageManager(map);
  return map;
}

export async function renderTiledMap(
  element: HTMLDivElement,
  config: TileBoundsResult,
  style: any,
  initializeMap: MapInitFunction = defaultInitializeMap,
  options: { internalScaleFactor?: number } = {},
) {
  const { tiles, bounds } = config;
  const { internalScaleFactor = 1 } = options;

  const container = document.createElement("div");
  container.className = "map-container";
  element.appendChild(container);

  const map = initializeMap({
    container,
    style,
    trackResize: false,
    attributionControl: false,
    interactive: false,
    maxZoom: 22,
    pixelRatio: 4,
    pitchWithRotate: false,
    dragRotate: false,
    touchPitch: false,
    boxZoom: false,
  });

  const imageContainer = document.createElement("div");
  imageContainer.className = "image-container";
  element.appendChild(imageContainer);

  imageContainer.style.position = "relative";
  imageContainer.style.width = config.pixelSize.width + "px";
  imageContainer.style.height = config.pixelSize.height + "px";

  for await (const tile of tiles) {
    const { bounds, pixelSize } = tile;
    console.log("Rendering tile:", tile, lngLatBounds(bounds));
    container.style.position = "absolute";
    container.style.visibility = "hidden";
    setSize(container, tile, internalScaleFactor);
    map.resize();
    map.fitBounds(lngLatBounds(bounds), { duration: 0, padding: 0 });
    await new Promise((resolve) => {
      map.once("idle", () => {
        resolve(null);
      });
    });
    const img = new Image();
    imageContainer.appendChild(img);
    setSize(img, tile);
    const dataUrl = map.getCanvas().toDataURL("image/png");
    img.src = dataUrl;

    await new Promise((resolve) => {
      img.onload = () => resolve(null);
    });
  }

  // Clean up
  map.remove();
  container.remove();
}

function setSize(element: HTMLDivElement, config: MapTile, scaleFactor = 1) {
  const { pixelSize } = config;
  element.style.width = pixelSize.width * scaleFactor + "px";
  element.style.height = pixelSize.height * scaleFactor + "px";
  element.style.position = "absolute";
  element.style.top = config.pixelOffset.top + "px";
  element.style.left = config.pixelOffset.left + "px";
}

export interface MapTileBoundsResult extends TileBoundsResult {
  realMetersPerPixel: number;
}

interface Padding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function expandPadding(
  padding: PaddingOptions | number | null | undefined,
): Padding {
  let defaultPadding = 0;
  if (typeof padding === "number") {
    defaultPadding = padding;
  }
  const defaultPadding2 = {
    top: defaultPadding,
    bottom: defaultPadding,
    left: defaultPadding,
    right: defaultPadding,
  };
  if (padding == null || typeof padding === "number") {
    return defaultPadding2;
  }

  return {
    ...padding,
    ...defaultPadding2,
  };
}

export function computeTiledBoundsForMap(
  _input: GeoJSON.Geometry | [number, number, number, number],
  options: TileComputationOptions = {},
): MapTileBoundsResult {
  let lngLatBBox: [number, number, number, number];
  if (!Array.isArray(_input)) {
    lngLatBBox = bbox(_input) as [number, number, number, number];
  } else {
    lngLatBBox = _input;
  }

  const bounds = mercatorBBox(lngLatBBox);
  const res = computeTiledBounds(bounds, options);
  return {
    ...res,
    realMetersPerPixel: getWidthOfMapView(lngLatBBox) / res.innerSize.width,
  };
}

export function computeTiledBounds(
  bounds: [number, number, number, number],
  options: TileComputationOptions = {},
): TileBoundsResult {
  /**
   *   Bounds are provided in raw mercator coordinates. This allows the
   *   function to be used for non-map contexts (e.g., cross-sections).
   */

  const padding = expandPadding(options.padding);

  const [minX0, minY0, maxX0, maxY0] = bounds;
  const ll0: [number, number] = [minX0, minY0];
  const ur0: [number, number] = [maxX0, maxY0];

  const { metersPerPixel = 10, tileSize = 1024 } = options;
  const width = ur0[0] - ll0[0];
  const height = ur0[1] - ll0[1];

  const innerWidth = width / metersPerPixel;
  const innerHeight = height / metersPerPixel;

  // Now that the meters per pixel is known, we can add the padding to the bounds
  const ll: [number, number] = [
    ll0[0] - padding.left * metersPerPixel,
    ll0[1] - padding.bottom * metersPerPixel,
  ];
  const ur: [number, number] = [
    ur0[0] + padding.right * metersPerPixel,
    ur0[1] + padding.top * metersPerPixel,
  ];

  const pixelWidth = innerWidth + padding.left + padding.right;
  const pixelHeight = innerHeight + padding.top + padding.bottom;

  const paddedBounds: [number, number, number, number] = [
    ll[0],
    ll[1],
    ur[0],
    ur[1],
  ];
  const tilesX = Math.ceil(pixelWidth / tileSize);
  const tilesY = Math.ceil(pixelHeight / tileSize);

  // Iterate over tiles in x and y directions
  let sx = 0;
  let sy: number;
  const tiles: MapTile[] = [];
  for (let x = 0; x < tilesX; x++) {
    sy = 0;
    const tileWidth = sx + tileSize > pixelWidth ? pixelWidth - sx : tileSize;
    for (let y = 0; y < tilesY; y++) {
      const tileHeight =
        sy + tileSize > pixelHeight ? pixelHeight - sy : tileSize;

      const minX = ll[0] + sx * metersPerPixel;
      const minY = ll[1] + sy * metersPerPixel;
      const maxX = minX + tileWidth * metersPerPixel;
      const maxY = minY + tileHeight * metersPerPixel;

      tiles.push({
        bounds: [minX, minY, maxX, maxY],
        pixelSize: {
          width: tileWidth,
          height: tileHeight,
        },
        pixelOffset: {
          left: sx,
          top: pixelHeight - sy - tileHeight,
        },
      });

      sy += tileSize;
    }
    sx += tileSize;
  }

  return {
    tiles,
    pixelSize: {
      width: pixelWidth,
      height: pixelHeight,
    },
    // Size excluding padding
    innerSize: {
      width: innerWidth,
      height: innerHeight,
    },
    padding,
    innerBounds: bounds,
    bounds: paddedBounds,
    metersPerPixel,
  };
}

export function getLineOverallAngle(
  geojson: GeoJSON.LineString,
): number | null {
  const coords = geojson.coordinates;
  if (coords.length < 2) return null;
  // Convert to web mercator since it preserves angles
  const p1 = mercator.forward(coords[0]);
  const p2 = mercator.forward(coords[coords.length - 1]);
  const height = p2[1] - p1[1];
  const width = p2[0] - p1[0];
  console.log(width, height);
  const angle = Math.atan2(height, width);
  return (angle * 180) / Math.PI;
}

export function getWidthOfMapView(bbox) {
  // Get the real-world width of the bbox in meters
  // Does not handle low-zoom cases as yet
  const nw = [bbox[0], bbox[3]];
  const ne = [bbox[2], bbox[3]];
  const sw = [bbox[0], bbox[1]];
  const se = [bbox[2], bbox[1]];
  const d0 = distance(nw, ne, { units: "meters" });
  const d1 = distance(sw, se, { units: "meters" });
  return (d0 + d1) / 2;
}
