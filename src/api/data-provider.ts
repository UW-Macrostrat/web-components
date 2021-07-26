import h from "@macrostrat/hyper";
import { createContext, useContext, ReactNode } from "react";
import { useAPIResult, QueryParams, APIConfigOptions } from "./provider";

interface DataProviderCtx {
  [key: string]: string | object | object[] | null;
}

interface DataProviderProps {
  children?: ReactNode;
  key: string;
  data: any;
}

const APIResultContext = createContext<DataProviderCtx>({});

export function DataProvider(props: DataProviderProps) {
  const { children, key, data } = props;
  const baseValue = useContext(APIResultContext);
  const value = { ...baseValue, [key]: data };
  return h(APIResultContext.Provider, { value }, children);
}

interface APIDataProviderProps extends Partial<APIConfigOptions> {
  key: string;
  route: string;
  params?: QueryParams;
  children?: ReactNode;
}

export function APIDataProvider<T>(props: APIDataProviderProps) {
  const { route, params, children, key, ...opts } = props;
  const data: T | null = useAPIResult(route, params, opts);
  return h(DataProvider, { key, data }, children);
}

export function useData(key: string) {
  return useContext(APIResultContext)[key];
}
