import { createPatternImage, loadImage } from "./composite-image";
import { memoize } from "underscore";

const vizBaseURL = "//visualization-assets.s3.amazonaws.com";
const patternBaseURL = vizBaseURL + "/geologic-patterns/png";
const lineSymbolsURL = vizBaseURL + "/geologic-line-symbols/png";

function geologyPatternURL(symbol, baseURL = patternBaseURL) {
  return baseURL + `/${symbol}.png`;
}

async function _geologyPatternImage(
  patternID: string,
  color = null,
  patternColor = null
) {
  const url = geologyPatternURL(patternID);
  if (color == null && patternColor == null) {
    return loadImage(url);
  }

  const img = await createPatternImage({
    patternURL: url,
    color,
    patternColor
  });
  return img;
}

const geologyPatternImage = memoize(_geologyPatternImage);

export { geologyPatternURL, geologyPatternImage };
export * from "./composite-image";
