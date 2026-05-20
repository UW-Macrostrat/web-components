/**
 * Utility type for a type that must have a specific key, but may have other keys as well.
 *
 * This is useful to have types that can be enhanced into "full" objects by lookup
 */
export type TypeIdentifier<T, key extends keyof T> = Partial<T> & Pick<T, key>;
