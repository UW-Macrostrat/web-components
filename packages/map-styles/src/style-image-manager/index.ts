import { createSolidColorImage, loadImage } from "../layer-helpers/pattern-fill";
import { createPatternImage } from "@macrostrat/ui-components";

interface StyleImageManagerOptions {
  baseURL?: string;
  pixelRatio?: number;
}

export function setupStyleImageManager(
  map: any,
  options: StyleImageManagerOptions = {},
): () => void {
  const styleImageMissing = (e) => {
    loadStyleImage(map, e.id, options)
      .catch((err) => {
        console.error(`Failed to load pattern image for ${e.id}:`, err);
      })
      .then(() => {});
  };

  // Register the event listener for missing images
  map.on("styleimagemissing", styleImageMissing);
  return () => {
    // Clean up the event listener when the component unmounts
    map.off("styleimagemissing", styleImageMissing);
  };
}

async function loadStyleImage(
  map: mapboxgl.Map,
  id: string,
  options: StyleImageManagerOptions = {},
) {
  const [prefix, name, ...rest] = id.split(":");

  //console.log("Loading style image:", id, prefix, name, rest);

  if (prefix == "point") {
    await loadSymbolImage(
      map,
      "geologic-symbols/points/strabospot",
      id,
      SymbolImageFormat.PNG,
      options
    );
  } else if (prefix == "line-symbol") {
    // Load line symbol image
    await loadSymbolImage(
      map,
      "geologic-symbols/lines/dev",
      id,
      SymbolImageFormat.PNG,
      options
    );
    // }
    //else if (prefix == "cross-section") {
    // TODO: better resolver for symbols
    // Load cross-section specific symbols
    // if (name in crossSectionSymbols) {
    //   const imgURL = crossSectionSymbols[name];
    //   if (imgURL == null) {
    //     console.warn(`No image data found for cross-section symbol: ${name}`);
    //     return;
    //   }
    //   await addImageURLToMap(map, id, imgURL, { sdf: false, pixelRatio });
    // }
  } else {
    // Load pattern image
    await loadPatternImage(map, id, options);
  }
}

enum SymbolImageFormat {
  PNG = "png",
  SVG = "svg",
}

async function loadSymbolImage(
  map: mapboxgl.Map,
  set: string,
  id: string,
  format: SymbolImageFormat = SymbolImageFormat.PNG,
  options: StyleImageManagerOptions = {},
) {
  const { pixelRatio = 3, baseURL = "https://dev.macrostrat.org/assets/web" } = options;
  const [prefix, name, ...rest] = id.split(":");
  const lineSymbolsURL = `${baseURL}/${set}/${format}`;
  await addImageURLToMap(map, id, lineSymbolsURL + `/${name}.${format}`, {
    sdf: true,
    pixelRatio,
  });
}

async function loadPatternImage(
  map: mapboxgl.Map,
  patternSpec: string,
  options: StyleImageManagerOptions = {},
) {
  const { pixelRatio = 3 } = options;
  if (map.hasImage(patternSpec)) return;
  const image = await buildPatternImage(patternSpec, options);
  if (map.hasImage(patternSpec) || image == null) return;

  map.addImage(patternSpec, image, {
    pixelRatio, // Use a higher pixel ratio for better quality
  });
}

export function addImageToMap(
  map: mapboxgl.Map,
  id: string,
  image: HTMLImageElement | ImageData | null,
  options: any,
) {
  if (map.hasImage(id) || image == null) return;
  map.addImage(id, image, options);
}

export async function addImageURLToMap(
  map: mapboxgl.Map,
  id: string,
  url: string,
  options: mapboxgl.AddImageOptions = {},
) {
  if (map.hasImage(id)) return;
  const image = await loadImage(url);
  if (map.hasImage(id) || image == null) return;
  map.addImage(id, image, options);
}

async function buildPatternImage(
  patternSpec: string,
  options: StyleImageManagerOptions = {},

): Promise<HTMLImageElement | ImageData | null> {
  const { baseURL = "https://dev.macrostrat.org/assets/web" } = options;
  const [prefix, ...rest] = patternSpec.split(":");
  if (prefix == "fgdc") {
    const [name, color, backgroundColor = "transparent"] = rest;

    const num = parseInt(name);
    let patternName = name;
    if (num == NaN) {
      throw new Error(`Invalid FGDC pattern name: ${name}`);
    }
    if (num <= 599) {
      // FGDC 1-599 are fill patterns
      // Check if pattern ID has a suffix, or if not add one
      patternName = `${num}-K`

    }

    return await createPatternImage({
      patternURL: `${baseURL}/geologic-patterns/png/${patternName}.png`,
      color: backgroundColor,
      patternColor: color,
    }) as ImageData
  } else if (prefix == "color") {
    // Create a solid color image
    const color = rest[0];
    return createSolidColorImage(color);
  }
  return null;
}
