import {
  createPatternImage,
  loadImage,
  ImageDataFormat
} from "./composite-image";
import { memoize } from "underscore";

const vizBaseURL = "https://visualization-assets.s3.amazonaws.com";
const patternBaseURL = vizBaseURL + "/geologic-patterns/png";
const lineSymbolsURL = vizBaseURL + "/geologic-line-symbols/png";

function _geologyPatternBaseURL(
  symbol: string | null,
  baseURL = patternBaseURL
) {
  if (symbol == null) return null;
  return baseURL + `/${symbol}.png`;
}

async function _geologyPatternURL(
  patternID: string | null,
  color = null,
  patternColor = null
): Promise<string> {
  const url = _geologyPatternBaseURL(patternID);
  if (color == null && patternColor == null) {
    return url;
  }

  const img = await createPatternImage(
    {
      patternURL: url,
      color,
      patternColor
    },
    ImageDataFormat.Base64
  );
  return img;
}

const geologyPatternURL = _geologyPatternURL;

const geologyPatternImage = async (...args) =>
  loadImage(await geologyPatternImage(...args));

export { geologyPatternURL, geologyPatternImage };
export * from "./composite-image";
