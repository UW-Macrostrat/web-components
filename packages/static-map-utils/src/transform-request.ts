import { useCallback } from "react";
import {
  isMapboxURL,
  transformMapboxUrl,
} from "maplibregl-mapbox-request-transformer";

const SKU_ID = "01";

interface SkuTokenObject {
  token: string;
  tokenExpiresAt: number;
}

function createSkuToken(): SkuTokenObject {
  // SKU_ID and TOKEN_VERSION are specified by an internal schema and should not change
  const TOKEN_VERSION = "1";
  const base62chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // sessionRandomizer is a randomized 10-digit base-62 number
  let sessionRandomizer = "";
  for (let i = 0; i < 10; i++) {
    sessionRandomizer += base62chars[Math.floor(Math.random() * 62)];
  }
  const expiration = 12 * 60 * 60 * 1000; // 12 hours
  const token = [TOKEN_VERSION, SKU_ID, sessionRandomizer].join("");
  const tokenExpiresAt = Date.now() + expiration;

  return { token, tokenExpiresAt };
}

export { createSkuToken, SKU_ID };

const defaultExtraParams = {
  sku: createSkuToken().token,
};

export function useMapboxRequestTransformer(
  mapboxToken,
  extraParams = defaultExtraParams,
) {
  return useCallback(
    (url, resourceType) => {
      let transformedURL = url;
      if (url.includes("mapbox.com") || url.startsWith("mapbox://")) {
        if (isMapboxURL(url)) {
          const res = transformMapboxUrl(url, resourceType, mapboxToken);
          transformedURL = res.url;
        }

        if (extraParams != null) {
          // Add extra parameters
          const [base, queryString] = transformedURL.split("?");
          const query = new URLSearchParams(queryString);
          for (const [key, value] of Object.entries(extraParams)) {
            query.set(key, value);
          }
          transformedURL = base + "?" + query.toString();
        }
      }
      return { url: transformedURL };
    },
    [mapboxToken, extraParams],
  );
}
