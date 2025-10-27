import { createSolidColorImage, loadImage } from "./pattern-images";

export function setupStyleImageManager(
  map: any,
  pixelRatio: number,
): () => void {
  const styleImageMissing = (e) => {
    loadStyleImage(map, e.id, pixelRatio)
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
  pixelRatio: number = 3,
) {
  const [prefix, name, ...rest] = id.split(":");

  //console.log("Loading style image:", id, prefix, name, rest);

  if (prefix == "point") {
    await loadSymbolImage(
      map,
      "geologic-symbols/points/strabospot",
      id,
      SymbolImageFormat.PNG,
      pixelRatio,
    );
  } else if (prefix == "line-symbol") {
    // Load line symbol image
    await loadSymbolImage(
      map,
      "geologic-symbols/lines/dev",
      id,
      SymbolImageFormat.PNG,
      pixelRatio,
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
    await loadPatternImage(map, id, pixelRatio);
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
  pixelRatio: number = 3,
) {
  const [prefix, name, ...rest] = id.split(":");
  const lineSymbolsURL = `https://dev.macrostrat.org/assets/web/${set}/${format}`;
  await addImageURLToMap(map, id, lineSymbolsURL + `/${name}.${format}`, {
    sdf: true,
    pixelRatio,
  });
}

async function loadPatternImage(
  map: mapboxgl.Map,
  patternSpec: string,
  pixelRatio: number = 3,
) {
  if (map.hasImage(patternSpec)) return;
  const image = await buildPatternImage(patternSpec);
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
  scale: number = 4,
): Promise<HTMLImageElement | ImageData | null> {
  const [prefix, ...rest] = patternSpec.split(":");
  if (prefix == "fgdc") {
    const [name, color, backgroundColor] = rest;

    const urlParams = new URLSearchParams();
    urlParams.set("scale", scale.toString());
    if (backgroundColor) {
      urlParams.set("background-color", backgroundColor);
    }
    if (color) {
      urlParams.set("color", color);
    }

    const url = `/styles/pattern/${name}.png?${urlParams.toString()}`;
    return await loadImage(url);
  } else if (prefix == "color") {
    // Create a solid color image
    const color = rest[0];
    return createSolidColorImage(color);
  }
  return null;
}
