import { stringify, StringifyOptions } from "query-string";

// API query string management
export type APIParams = Record<string, string>;

interface QueryArgs {
  [k: string]: any;
}

export type QueryParams =
  | string
  | string[][]
  | QueryArgs
  | APIParams
  | URLSearchParams
  | null;

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
  return p;
}

function buildQueryURL(
  route: string,
  params: QueryParams = {},
  opts?: StringifyOptions
): string {
  route += "?" + buildQueryString(params, opts);
  return route;
}

// Base query string management

function parseParams(paramString: string) {
  const params = new URLSearchParams(paramString);
  let obj = {};
  params.forEach((v, k) => {
    const parsed = parseInt(v);
    obj[k] = isNaN(parsed) ? v : parsed;
  });
  const hasKeys = Object.keys(obj).length > 0;
  return hasKeys ? obj : null;
}

function encodeParams(args: QueryArgs) {
  const params = new URLSearchParams();
  for (const k in args) {
    params.set(k, args[k]);
  }
  return params;
}

const updateURL = (joinWith: string, args: QueryArgs) => {
  const params = encodeParams(args);
  window.history.replaceState(
    {},
    "",
    `${document.location.pathname}${joinWith}${params}`
  );
};

const getHashString = () => parseParams(document.location.hash);
const setHashString = (args: QueryArgs) => updateURL("#", args);

const getQueryString = () => parseParams(document.location.search);
const setQueryString = (args: QueryArgs) => updateURL("?", args);

export {
  buildQueryString,
  buildQueryURL,
  getQueryString,
  setQueryString,
  getHashString,
  setHashString
};
