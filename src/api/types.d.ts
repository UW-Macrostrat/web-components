type APIParams = Record<string, string|number>

declare type QueryParams =
  | string
  | string[][]
  | APIParams
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
