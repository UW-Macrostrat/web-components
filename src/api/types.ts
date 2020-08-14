export type APIParams = Record<string, string>;

export type QueryParams =
  | string
  | string[][]
  | APIParams
  | URLSearchParams
  | null;

export interface APIConfig {
  fullResponse: boolean;
  handleError: boolean;
  memoize: boolean;
  onError(e: Error, opts: any): void;
  onResponse<T>(a: T): void;
  unwrapResponse<T, U>(a: T): U;
}

export type APIOptions = Partial<APIConfig>;
