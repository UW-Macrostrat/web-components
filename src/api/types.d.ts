declare type QueryParams =
  | string
  | string[][]
  | Record<string, string>
  | URLSearchParams

declare interface APIConfig {
  fullResponse: boolean,
  handleError: boolean,
  memoize: boolean,
  onError(e: Error, opts: any): void,
  onResponse<T>(a: T): void,
  unwrapResponse<T,U>(a: T): U,
}

declare type APIOptions = Partial<APIConfig>
