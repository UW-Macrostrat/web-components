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
  opts: StringifyOptions = {}
): string {
  let p: string;
  if (typeof params === "string") {
    p = params;
  } else {
    console.log(params, opts);
    p = stringify(params, { arrayFormat: "comma", ...opts });
  }
  return p;
}

function buildQueryURL(
  route: string,
  params: QueryParams = {},
  opts?: StringifyOptions
): string {
  const queryStr = buildQueryString(params, opts);
  if (queryStr == "") {
    return route;
  } else {
    return route + "?" + queryStr;
  }
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
  let pathname = document.location.pathname;
  if (params != "") {
    pathname += joinWith + params;
  }
  window.history.replaceState({}, "", pathname);
}

const getHashString = () => parseParams(document.location.hash);
const setHashString = (args: QueryArgs, opts?: StringifyOptions) =>
  updateURL("#", args, opts);

const getQueryString = () => parseParams(document.location.search);
const setQueryString = (args: QueryArgs, opts?: StringifyOptions) =>
  updateURL("?", args, opts);

export {
  buildQueryString,
  buildQueryURL,
  getQueryString,
  setQueryString,
  getHashString,
  setHashString
};
