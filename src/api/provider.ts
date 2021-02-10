import { createContext, useState, useContext, Context } from "react";
import h from "react-hyperscript";
import { memoize } from "underscore";
import axios, { AxiosPromise, AxiosInstance, AxiosRequestConfig } from "axios";
import useAsyncEffect from "use-async-effect";
import { debounce } from "underscore";
import { APIConfig, APIConfigOptions, ResponseUnwrapper } from "./types";
import { QueryParams } from "../util/query-string";

type APIBase = { baseURL: string; axiosInstance: AxiosInstance };
type APIContextValue = APIBase & {
  config: APIConfig;
};
type APIProviderProps = Partial<APIConfig> &
  Partial<AxiosRequestConfig> & {
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
  }
};

const defaultAxios = axios.create();

function createAPIContext(
  defaultProps: Partial<APIContextValue> = {}
): APIContextType {
  return createContext<APIContextValue>({
    baseURL: defaultAxios.defaults.baseURL ?? "",
    // We use Axios's in-built context functionality
    axiosInstance: defaultAxios,
    config: {
      ...apiDefaults,
      ...defaultProps
    }
  });
}

const APIContext = createAPIContext();

async function handleResult(promise: AxiosPromise, route, url, method, opts) {
  let res;
  const { onError } = opts;
  try {
    res = await promise;
    opts.onResponse(res);
    const { data } = res;
    if (data == null) {
      throw res.error || "No data!";
    }
    return opts.unwrapResponse(data);
  } catch (err) {
    if (!opts.handleError) {
      throw err;
    }
    console.error(err);
    onError(route, {
      error: err,
      response: res,
      endpoint: url,
      method
    });
    return null;
  }
}

const APIHelpers = (ctx: APIContextValue) => ({
  buildURL(route: string = "", params = {}) {
    return ctx.axiosInstance.getUri({
      url: route,
      params
    });
  },
  processOptions(opts: APIConfigOptions = {}): APIConfig {
    let o1: APIConfig = { ...ctx.config, ...opts };
    if (o1.fullResponse) o1.unwrapResponse = apiDefaults.unwrapResponse;
    return o1;
  }
});

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
  const { processOptions, buildURL } = APIHelpers(ctx);
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
      params = params ?? {};

      const url = buildURL(route, params);
      opts = processOptions(opts ?? {});

      const req = axiosInstance.post(route, payload, { params });

      return handleResult(req, route, url, "POST", opts);
    },
    get(route: string, ...args) {
      let params: QueryParams, opts: APIConfigOptions;
      if (args.length == 1) {
        [opts] = args;
      } else if (args.length == 2) {
        [params, opts] = args;
      }
      params = params ?? {};

      const url = buildURL(route, params);
      opts = processOptions(opts ?? {});

      const { get } = axiosInstance;
      const fn = opts.memoize ? memoize(get) : get;

      const req = fn(url, { params });
      return handleResult(req, route, url, "GET", opts);
    }
  };
};

const APIProvider = (props: APIProviderProps) => {
  /** Provider for APIContext

  can pass an alternative API context using "context" param
  */
  const {
    children,
    context = APIContext,
    // These should maybe be reworked into a legacy options set...
    fullResponse,
    handleError,
    memoize,
    onError,
    onResponse,
    unwrapResponse,
    ...axiosConfig
  } = props;

  const axiosInstance = axios.create(axiosConfig);

  const value = {
    axiosInstance,
    baseURL: axiosInstance.defaults.baseURL ?? "",
    config: {
      ...apiDefaults,
      fullResponse,
      handleError,
      memoize,
      onError,
      onResponse,
      unwrapResponse
    }
  };
  return h(context.Provider, { value }, children);
};

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

const useAPIResult = function<T>(
  route: string | null,
  params: QueryParams = {},
  opts: APIHookOpts | ResponseUnwrapper<any, T> = {}
): T {
  /* React hook for API results */
  const deps = [route, ...Object.values(params ?? {})];

  const [result, setResult] = useState<T | null>(null);

  if (typeof opts === "function") {
    opts = { unwrapResponse: opts };
  }

  const { debounce: _debounce, context, ...rest } = opts ?? {};
  let { get } = useAPIActions(context);

  const _getAPIData = async function() {
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
};

export {
  createAPIContext,
  useAxiosInstance,
  APIContext,
  APIProvider,
  APIActions,
  APIHelpers,
  useAPIActions,
  useAPIResult,
  useAPIHelpers
};
