import { QueryParams } from "./types";

import { stringify, StringifyOptions } from "query-string";

function buildQueryString(
  params: QueryParams,
  opts?: StringifyOptions
): string {
  let p: string;
  if (typeof params === "string") {
    p = params;
  } else {
    p = stringify(params, { arrayFormat: "comma", ...opts });
  }

  if (p !== "") {
    p = "?" + p;
  }
  return p;
}

function buildURL(
  route: string,
  params: QueryParams = {},
  opts?: StringifyOptions
): string {
  route += buildQueryString(params, opts);
  return route;
}

export { buildQueryString, buildURL };
