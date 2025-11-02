import {
  createSolidColorImage,
  loadImage,
} from "../layer-helpers/pattern-fill";
import { createPatternImage } from "@macrostrat/ui-components";

export interface StyleImageManagerOptions {
  baseURL?: string;
  pixelRatio?: number;
  resolvers?: Record<string, PatternResolverFunction>;
  throwOnMissing?: boolean;
}

type PatternResolverFunction = (
  key: string,
  args: string[],
  options: StyleImageManagerOptions,
) => Promise<PatternResult | ImageResult>;

type ImageResult =
  | HTMLImageElement
  | ImageData
  | { url: string; options?: AddImageOptions }
  | null;

interface PatternResult {
  image: ImageResult;
  options?: AddImageOptions;
}

interface AddImageOptions {
  sdf?: boolean;
  pixelRatio?: number;
}

export function setupStyleImageManager(
  map: any,
  options: StyleImageManagerOptions = {},
): () => void {
  const { throwOnMissing = false } = options;
  const styleImageMissing = (e) => {
    loadStyleImage(map, e.id, options)
      .catch((err) => {
        if (throwOnMissing) {
          throw err;
        }
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
  const { pixelRatio = 3 } = options;
  const [prefix, name, ...rest] = id.split(":");

  const { resolvers = defaultResolvers } = options;

  // Match the prefix to a resolver function
  if (prefix in resolvers) {
    const resolver = resolvers[prefix];
    const result = await resolver(prefix, [name, ...rest], options);

    let image: ImageResult = null;
    let addOptions: AddImageOptions = { pixelRatio };

    if (result != null) {
      if ("options" in result) {
        addOptions = { ...addOptions, ...(result.options ?? {}) };
      }
      if ("image" in result) {
        image = result.image;
        addOptions = { ...addOptions, ...(result.options ?? {}) };
      } else {
        image = result;
      }
    }
    if (image == null) {
      throw new Error(`No image returned by resolver for pattern: ${id}`);
    }
    if (typeof image === "object" && "url" in image) {
      await addImageURLToMap(map, id, image.url, addOptions);
    } else {
      addImageToMap(map, id, image, addOptions);
    }
    return;
  }
}

enum SymbolImageFormat {
  PNG = "png",
  SVG = "svg",
}

function resolveLineSymbolImage(
  id: string,
  args: string[],
  options: StyleImageManagerOptions = {},
) {
  return resolveSymbolImage(
    "geologic-symbols/lines/dev",
    args,
    SymbolImageFormat.PNG,
    options,
  );
}

function resolvePointSymbolImage(
  id: string,
  args: string[],
  options: StyleImageManagerOptions = {},
) {
  return resolveSymbolImage(
    "geologic-symbols/points/strabospot",
    args,
    SymbolImageFormat.PNG,
    options,
  );
}

function resolveSymbolImage(
  set: string,
  args: string[],
  format: SymbolImageFormat = SymbolImageFormat.PNG,
  options: StyleImageManagerOptions = {},
) {
  const { baseURL = "https://dev.macrostrat.org/assets/web" } = options;
  const [name, ...rest] = args;
  const lineSymbolsURL = `${baseURL}/${set}/${format}`;
  return { url: lineSymbolsURL + `/${name}.${format}`, options: { sdf: true } };
}

export function addImageToMap(
  map: mapboxgl.Map,
  id: string,
  image: HTMLImageElement | ImageData | null,
  options: AddImageOptions,
) {
  if (map.hasImage(id) || image == null) return;
  map.addImage(id, image, options);
}

export async function addImageURLToMap(
  map: mapboxgl.Map,
  id: string,
  url: string,
  options: AddImageOptions,
) {
  if (map.hasImage(id)) return;
  const image = await loadImage(url);
  addImageToMap(map, id, image, options);
}

async function resolveFGDCImage(
  key: string,
  args: string[],
  options: StyleImageManagerOptions,
): Promise<PatternResult | null> {
  const { baseURL = "https://dev.macrostrat.org/assets/web" } = options;
  const [name, color, backgroundColor = "transparent"] = args;

  const num = parseInt(name);
  let patternName = name;
  if (num == NaN) {
    throw new Error(`Invalid FGDC pattern name: ${name}`);
  }
  if (num <= 599) {
    // FGDC 1-599 are fill patterns
    // Check if pattern ID has a suffix, or if not add one
    patternName = `${num}-K`;
  }

  const image = (await createPatternImage({
    patternURL: `${baseURL}/geologic-patterns/png/${patternName}.png`,
    color: backgroundColor,
    patternColor: color,
  })) as ImageData;

  return image;
}

async function resolveSolidColorImage(
  key: string,
  args: string[],
  options: StyleImageManagerOptions,
): Promise<ImageData> {
  return createSolidColorImage(args[0]);
}

export const defaultResolvers: Record<string, PatternResolverFunction> = {
  fgdc: resolveFGDCImage,
  color: resolveSolidColorImage,
  "line-symbol": resolveLineSymbolImage,
  point: resolvePointSymbolImage,
};
