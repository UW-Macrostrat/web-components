import { Tooltip } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useEffect, useState, type ReactNode } from "react";
import styles from "./main.module.sass";

const h = hyper.styled(styles);

export const DEFAULT_MODEL_DETAILS_ENDPOINT =
  "https://dev.macrostrat.org/api/pg/kg_model_details";

/** A row from kg_model_details, or the legacy model lookup with run IDs. */
export interface ModelInfoData {
  model_id?: number | string | null;
  model_name?: string | null;
  model_description?: string | null;
  modelurl?: string | null;
  version_id?: number | string | null;
  version_name?: string | null;
  version_description?: string | null;
  id?: number | string;
  name?: string | null;
  description?: string | null;
  url?: string | null;
}

export interface ModelInfoProps {
  data?: ModelInfoData | null;
  /** Override the PostgREST route for another deployment; null disables fetches. */
  modelDetailsEndpoint?: string | null;
}

export function ModelInfo({
  data,
  modelDetailsEndpoint = DEFAULT_MODEL_DETAILS_ENDPOINT,
}: ModelInfoProps) {
  const details = useModelDetails(data, modelDetailsEndpoint);
  if (data == null) return null;

  const modelID = data.model_id ?? data.id;
  const name = details?.model_name ?? data.model_name ?? data.name;
  let label = name;
  if (!label && modelID != null) label = `#${modelID}`;
  if (!label) return null;

  const description = (
    details?.model_description ??
    data.model_description ??
    data.description
  )?.trim();
  const url = modelURL(details?.modelurl ?? data.modelurl ?? data.url);
  let model: ReactNode = h("code.bp6-code", label);
  if (url != null) {
    model = h(
      "a",
      { href: url, target: "_blank", rel: "noopener noreferrer" },
      model,
    );
  } else if (description) {
    model = h(
      Tooltip,
      { content: description },
      h("span.model-description", { tabIndex: 0 }, model),
    );
  }

  const versionName = details?.version_name ?? data.version_name;
  const versionDescription = (
    details?.version_description ?? data.version_description
  )?.trim();
  let version: ReactNode = null;
  if (versionName != null && versionName !== "") {
    version = h("code.bp6-code", versionName);
    if (versionDescription) {
      version = h(
        Tooltip,
        { content: versionDescription },
        h("span.model-description", { tabIndex: 0 }, version),
      );
    }
    version = h("span.model-version", ["Version: ", version]);
  }

  return h("p.model-name", ["Model: ", model, version]);
}

function useModelDetails(
  data: ModelInfoData | null | undefined,
  endpoint: string | null,
) {
  const modelID = data?.model_id ?? data?.id;
  const versionID = data?.version_id;
  // Fully populated API rows can be rendered without a second request.
  const complete =
    data?.model_name != null &&
    data.modelurl !== undefined &&
    data.model_description !== undefined &&
    (versionID == null ||
      (data.version_name !== undefined &&
        data.version_description !== undefined));
  let query: string | null = null;
  if (!complete && endpoint && modelID != null) {
    const params = new URLSearchParams({
      model_id: `eq.${modelID}`,
      limit: "1",
    });
    if (versionID != null) {
      params.set("version_id", `eq.${versionID}`);
    } else {
      // Without a run version, fetch only model metadata, never an arbitrary version.
      params.set("select", "model_id,model_name,model_description,modelurl");
    }
    let separator = "?";
    if (endpoint.includes("?")) separator = "&";
    query = `${endpoint}${separator}${params}`;
  }

  const [result, setResult] = useState<{
    query: string;
    data: ModelInfoData;
  } | null>(null);
  useEffect(() => {
    if (query == null) return;
    const requestQuery = query;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(requestQuery, { signal: controller.signal });
        if (!response.ok) return;
        const rows = await response.json();
        if (
          !controller.signal.aborted &&
          Array.isArray(rows) &&
          rows.length > 0
        ) {
          setResult({ query: requestQuery, data: rows[0] });
        }
      } catch {
        // Keep the supplied model visible when metadata is unavailable.
      }
    }
    void load();
    return () => controller.abort();
  }, [query]);

  if (complete) return data;
  if (query != null && result?.query === query) return result.data;
  return null;
}

function modelURL(value?: string | null): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    // Invalid URLs use the same description/plain-text fallback as missing URLs.
  }
  return null;
}
