import {
  createContext,
  useState,
  useContext,
  Context,
  useRef,
  useEffect,
} from "react";
import h from "@macrostrat/hyper";
import { memoize, isEqual } from "underscore";
import axios, {
  AxiosPromise,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import useAsyncEffect from "use-async-effect";
import { debounce } from "underscore";
import { APIConfig, ResponseUnwrapper, APIConfigOptions } from "./types";
import { QueryParams } from "../util/query-string";

/*
The baseURL is used to prefix paths if they are not already absolute
https://github.com/axios/axios/blob/master/lib/core/buildFullPath.js
*/
type APIBase = { baseURL: string; axiosInstance: AxiosInstance };
type APIContextValue = APIBase & {
  config: APIConfig;
};

type APIProviderCoreProps = APIConfigOptions &
  Partial<AxiosRequestConfig> & {
    config?: Partial<APIConfigOptions>;
  };

type APIProviderProps = APIProviderCoreProps & {
  context?: Context<APIContextValue>;
  children?: React.ReactChild;
};

type APIContextType = Context<APIContextValue>;

const apiDefaults: APIConfig = {
  fullResponse: false,
  handleError: true,
  memoize: false,
  onError(err, opts) {
    let error = opts.error ?? opts;
    throw error;
  },
  onResponse(_) {},
  unwrapResponse(d) {
    return d;
  },
};

function removeUndefined(o1: object) {
  let obj = { ...o1 };
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
}

function splitConfig(
  props: APIProviderCoreProps
): [AxiosRequestConfig, APIConfig] {
  const {
    config = {},
    // These should maybe be reworked into a legacy options set...
    fullResponse,
    handleError,
    memoize,
    onError,
    onResponse,
    unwrapResponse,
    ...axiosConfig
  } = props;

  let legacyConfig = removeUndefined({
    fullResponse,
    handleError,
    memoize,
    onError,
    onResponse,
    unwrapResponse,
  });

  const newConfig = { ...apiDefaults, ...legacyConfig, ...config };
  return [axiosConfig, newConfig];
}

const defaultAxios = axios.create();

function createAPIContext(
  defaultProps: APIProviderCoreProps = {}
): APIContextType {
  const [axiosConfig, config] = splitConfig(defaultProps);

  const axiosInstance = axios.create(axiosConfig);

  const defaultValue = {
    axiosInstance,
    baseURL: axiosInstance.defaults.baseURL ?? "",
    config,
  };

  return createContext<APIContextValue>(defaultValue);
}

enum APIMethod {
  POST = "POST",
  GET = "GET",
}

const APIContext = createAPIContext();

interface APIRequestInfo {
  route: string;
  params: QueryParams;
  method: APIMethod;
  opts?: APIConfigOptions;
}

async function handleResult(
  ctx: APIContextValue,
  request: AxiosPromise,
  info: APIRequestInfo
) {
  const { processOptions, buildURL } = APIHelpers(ctx);
  const { opts, method, params, route } = info;
  const cfg = processOptions(opts);

  let res: AxiosResponse | null = null;
  let error: Error | null = null;
  try {
    res = await request;
    cfg.onResponse(res);
    if (res.data != null) return cfg.unwrapResponse(res.data);
  } catch (err) {
    error = err;
  }
  error = error ?? Error(res.statusText || "No data!");
  if (cfg.handleError) {
    // Log errors if we're not throwing
    console.error(error);
    cfg.onError(error, {
      error: error,
      response: res,
      endpoint: buildURL(route, params),
      method,
    });
  } else {
    throw error;
  }
}

const APIHelpers = (ctx: APIContextValue) => ({
  buildURL(route: string = "", params = {}) {
    // axios's getUri doesn't return baseURL for some inexplicable reason,
    // as of spring 2021.
    // this behavior could change sometime in the future...
    const uriPath = ctx.axiosInstance.getUri({
      url: route,
      params,
    });
    return ctx.baseURL + uriPath;
  },
  processOptions(opts: APIConfigOptions = {}): APIConfig {
    let o1: APIConfig = { ...ctx.config, ...opts };
    if (o1.fullResponse) o1.unwrapResponse = apiDefaults.unwrapResponse;
    return o1;
  },
});

function useStableObject(obj: any) {
  const ref = useRef(obj);
  if ((obj == ref.current, isEqual(obj, ref.current))) {
    return ref.current;
  } else {
    ref.current = obj;
    return obj;
  }
}

interface APIActions {
  post(
    route: string,
    params: QueryParams,
    payload: any,
    opts: APIConfigOptions
  ): Promise<any | null>;
  post(
    route: string,
    payload: any,
    opts?: APIConfigOptions
  ): Promise<any | null>;
  get(
    route: string,
    params: QueryParams,
    opts: APIConfigOptions
  ): Promise<any | null>;
  get(route: string, opts?: APIConfigOptions): Promise<any | null>;
}

const APIActions = (ctx: APIContextValue): APIActions => {
  const { axiosInstance } = ctx;
  return {
    post(route: string, ...args) {
      let opts: APIConfigOptions, params: QueryParams, payload: any;
      if (args.length === 3) {
        [params, payload, opts] = args;
      } else if (args.length === 2) {
        [payload, opts] = args;
      } else if (args.length === 1) {
        [payload] = args;
      } else {
        throw "No data to post";
      }
      params ??= {};
      opts ??= {};

      const [axiosConfig, _] = splitConfig(opts);

      const req = axiosInstance.post(route, payload, {
        ...axiosConfig,
        params,
      });
      const info = { route, params, method: APIMethod.POST, opts };
      return handleResult(ctx, req, info);
    },
    get(route: string, ...args) {
      let params: QueryParams, opts: APIConfigOptions;
      if (args.length == 1) {
        [opts] = args;
      } else if (args.length == 2) {
        [params, opts] = args;
      }
      params ??= {};
      opts ??= {};

      const [axiosConfig, cfg] = splitConfig(opts);
      const fn = cfg.memoize ? memoize(axiosInstance.get) : axiosInstance.get;

      const request = fn(route, { ...axiosConfig, params });
      const info = { route, params, method: APIMethod.GET, opts };
      return handleResult(ctx, request, info);
    },
  };
};

function APIProvider(props: APIProviderProps) {
  /** Provider for APIContext

  can pass an alternative API context using "context" param
  */
  const { context = APIContext, children, ...rest } = props;
  const [axiosConfig, config] = splitConfig(rest);

  const axiosInstance = axios.create(axiosConfig);

  const value = {
    axiosInstance,
    baseURL: axiosInstance.defaults.baseURL ?? "",
    config,
  };
  return h(context.Provider, { value }, children);
}

const useAPIActions = (ctx: APIContextType = APIContext) => {
  return APIActions(useContext(ctx));
};

const useAPIHelpers = (ctx: APIContextType = APIContext) => {
  return APIHelpers(useContext(ctx));
};

type APIHookOpts = Partial<
  APIConfig & {
    debounce?: number;
    context?: APIContextType;
  }
>;

function useAxiosInstance(context: APIContextType = APIContext) {
  return useContext(context).axiosInstance;
}

function useAPIResult<T>(
  route: string | null,
  params: QueryParams = null,
  opts: APIHookOpts | ResponseUnwrapper<any, T> = {}
): T {
  /* React hook for API results */

  const paramsDep = useStableObject(params);
  const deps = [route, paramsDep]; //...Object.values(params ?? {})];

  const [result, setResult] = useState<T | null>(null);

  if (typeof opts === "function") {
    opts = { unwrapResponse: opts };
  }

  const { debounce: _debounce, context, ...rest } = opts ?? {};
  let { get } = useAPIActions(context);

  const _getAPIData = async function () {
    if (route == null) {
      return setResult(null);
    }
    const res = await get(route, params, rest);
    return setResult(res);
  };

  const getAPIData =
    _debounce != null ? debounce(_getAPIData, _debounce) : _getAPIData;

  useAsyncEffect(getAPIData, deps);
  return result;
}

export {
  createAPIContext,
  useAxiosInstance,
  APIContext,
  APIProvider,
  APIActions,
  APIHelpers,
  useAPIActions,
  useAPIResult,
  useAPIHelpers,
};
