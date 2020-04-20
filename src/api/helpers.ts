const buildQueryString = (params: QueryParams): string => {
  let p = new URLSearchParams(params ?? {}).toString();
  if (p !== "") {
    p = "?"+p;
  }
  return p;
};

function buildURL(route: string, params: QueryParams ={}): string {
  route += buildQueryString(params);
  return route;
}

export {buildQueryString, buildURL}
