import { createContext, useContext } from "react";

/** Deployment-specific configuration for the feedback editor, provided by
 * `FeedbackComponent` from its props so nested controls need not thread it. */
export interface FeedbackConfig {
  /** PostgREST route of the Macrostrat terms view searched when a reviewer adds
   * a match to an entity (e.g. `https://dev.macrostrat.org/api/pg/kg_macrostrat_terms`).
   * `null` disables the match search. */
  termsEndpoint: string | null;
}

/** The development terms view: the historical default. Consumers should pass
 * their own `termsEndpoint` so the search follows their API configuration. */
export const DEFAULT_TERMS_ENDPOINT =
  "https://dev.macrostrat.org/api/pg/kg_macrostrat_terms";

export const FeedbackConfigContext = createContext<FeedbackConfig>({
  termsEndpoint: DEFAULT_TERMS_ENDPOINT,
});

export function useFeedbackConfig(): FeedbackConfig {
  return useContext(FeedbackConfigContext);
}
