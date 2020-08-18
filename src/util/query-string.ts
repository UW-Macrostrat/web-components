import { stringify, parse, StringifyOptions, ParseOptions } from "query-string";

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

function parseParams(paramString: string, opts?: ParseOptions) {
  const params = parse(paramString, {
    parseBooleans: true,
    parseNumbers: true,
    arrayFormat: "comma",
    ...opts
  });
  // Return null unless we have params defined
  return Object.keys(params).length > 0 ? params : null;
}

function updateURL(joinWith: string, args: QueryArgs, opts?: StringifyOptions) {
  const params = buildQueryString(args, opts);
  window.history.replaceState(
    {},
    "",
    `${document.location.pathname}${joinWith}${params}`
  );
}

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
