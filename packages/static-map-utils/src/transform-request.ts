import { useCallback } from "react";
import {
  isMapboxURL,
  transformMapboxUrl,
} from "maplibregl-mapbox-request-transformer";

export function useMapboxRequestTransformer(mapboxToken, extraParams = null) {
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
