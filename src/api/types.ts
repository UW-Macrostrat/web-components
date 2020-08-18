export type ResponseUnwrapper<T = any, U = any> = (input: T) => U;

export interface APIConfig {
  fullResponse: boolean;
  handleError: boolean;
  memoize: boolean;
  onError(e: Error, opts: any): void;
  onResponse<T>(a: T): void;
  unwrapResponse: ResponseUnwrapper;
}

export type APIOptions = Partial<APIConfig>;
