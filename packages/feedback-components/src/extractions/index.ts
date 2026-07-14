import styles from "./main.module.sass";
import classNames from "classnames";
import { Tag } from "@blueprintjs/core";
import type { Entity, EntityExt, Highlight, EntityType } from "./types";
import { CSSProperties } from "react";
import { asChromaColor } from "@macrostrat/color-utils";
import hyper from "@macrostrat/hyper";
import { useDarkMode } from "@macrostrat/ui-components";

export type { Entity, EntityExt };

const h = hyper.styled(styles);

export function buildHighlights(
  entities: EntityExt[],
  parent: EntityExt | null,
): Highlight[] {
  let highlights = [];
  let parents = [];
  if (parent != null) {
    parents = [parent.id, ...(parent.parents ?? [])];
  }

  for (const entity of entities) {
    highlights.push({
      start: entity.indices[0],
      end: entity.indices[1],
      text: entity.name,
      backgroundColor: entity.type?.color,
      tag: entity.type?.name ?? "lith",
      id: entity.id,
      parents,
      match: entity.match,
    });
    highlights.push(...buildHighlights(entity.children ?? [], entity));
  }
  return highlights;
}

export function enhanceData(extractionData, models, entityTypes) {
  return {
    ...extractionData,
    model: models.get(extractionData.model_id),
    entities: extractionData.entities?.map((d) =>
      enhanceEntity(d, entityTypes),
    ),
  };
}

export function getTagStyle(
  baseColor: string,
  options: {
    highlighted?: boolean;
    inDarkMode?: boolean;
    active?: boolean;
    showMatches?: boolean;
  } = {},
): CSSProperties {
  const _baseColor = asChromaColor(baseColor ?? "#fff");
  const {
    highlighted = true,
    inDarkMode = useDarkMode().isEnabled,
    active = false,
  } = options;

  let mixAmount = highlighted ? 0.8 : 0.5;
  let backgroundAlpha = highlighted ? 0.8 : 0.2;

  if (active) {
    mixAmount = 1;
    backgroundAlpha = 1;
  }

  const mixTarget = "black";

  const color = active ? "#000" : _baseColor.mix(mixTarget, mixAmount).hex();
  const borderColor = highlighted
    ? _baseColor.mix(mixTarget, mixAmount / 1.1).hex()
    : "transparent";

  let backgroundColor = active
    ? _baseColor.alpha(backgroundAlpha).hex()
    : normalizeColor(_baseColor.alpha(backgroundAlpha).hex());

  // handle white backgrounds in light mode
  if (!inDarkMode && backgroundColor === "#ffffff") {
    backgroundColor = "#f0f0f0";
  }

  return {
    color,
    backgroundColor,
    boxSizing: "border-box",
    borderStyle: "solid",
    borderColor,
    borderWidth: "1.5px",
    fontWeight: active ? "bold" : "normal",
    fontSize: "0.9em",
  };
}

function enhanceEntity(
  entity: Entity,
  entityTypes: Map<number, EntityType>,
): EntityExt {
  return {
    ...entity,
    type: addColor(entityTypes.get(entity.type), entity.match != null),
    children: entity.children?.map((d) => enhanceEntity(d, entityTypes)),
  };
}

function addColor(entityType: EntityType, match = false) {
  const color = asChromaColor(entityType.color ?? "#fff").brighten(
    match ? 1 : 2,
  );

  return { ...entityType, color: color.css() };
}

export function ExtractionContext({
  data,
  entityTypes,
  matchComponent,
}: {
  data: any;
  entityTypes: Map<number, EntityType>;
  matchComponent: MatchComponent;
}) {
  const highlights = buildHighlights(data.entities, null);

  return h("div", [
    h("p", h(HighlightedText, { text: data.paragraph_text, highlights })),
    h(ModelInfo, { data: data.model }),
    h(
      "ul.entities",
      data.entities.map((d) => h(ExtractionInfo, { data: d, matchComponent })),
    ),
  ]);
}

export function ModelInfo({ data }) {
  if (!data) return null;
  return h("p.model-name", ["Model: ", h("code.bp6-code", data.name)]);
}

export type MatchComponent = (props: { data: any }) => any;

type EntityTagProps = {
  data: EntityExt;
  highlighted?: boolean;
  active?: boolean;
  onClickType?: (type: EntityType) => void;
  matchComponent?: MatchComponent;
  matchLinks?: Record<string, string>;
};

export function EntityTag({
  data,
  highlighted = true,
  active = false,
  onClickType,
  matchComponent = null,
  matchLinks,
}: EntityTagProps) {
  const { name, type, match } = data;

  const className = classNames(
    {
      matched: match != null,
    },
    "entity",
  );

  const style = getTagStyle(type?.color, { highlighted, active });

  let _matchLink = null;
  if (match != null && matchComponent != null) {
    _matchLink = h(matchComponent, { data: match });
  }

  const matchId =
    match != null
      ? match.macrostrat_terms_id ??
        match.entity_id ??
        match.strat_name_id ??
        match.lith_id ??
        match.concept_id ??
        match.lith_att_id ??
        match.interval_id ??
        null
      : null;

  const entityTypeLabel =
    type?.name ?? match?.entity_type ?? match?.entityType ?? "entity";
  const matchLabel =
    matchId != null ? `${entityTypeLabel} #${matchId}` : entityTypeLabel;
  const matchUrl = getMatchUrl(match, matchLinks, type?.name);

  const content = matchUrl
    ? h(
        "a",
        {
          href: matchUrl,
          target: "_blank",
          rel: "noreferrer noopener",
          onClick(evt) {
            evt.stopPropagation();
          },
        },
        [matchLabel ?? type?.name],
      )
    : _matchLink ?? matchLabel ?? type?.name;

  return h(Tag, { style, className }, [
    h("span.entity-name", name),
    h(
      "code.entity-type.bp6-code",
      {
        onClick(evt) {
          if (active && onClickType != null) {
            onClickType(type);
            evt.stopPropagation();
          }
        },
      },
      [content],
    ),
  ]);
}

function getMatchUrl(
  match: any,
  matchLinks?: Record<string, string>,
  entityTypeName?: string,
) {
  if (!match || !matchLinks) return undefined;

  const prefix = getMatchPrefix(match, matchLinks, entityTypeName);
  const matchId = getMatchId(match);

  if (!prefix || matchId == null) {
    return undefined;
  }

  const normalized = prefix.replace(/\/$/, "");
  return `${normalized}/${matchId}`;
}

function getMatchPrefix(
  match: any,
  matchLinks?: Record<string, string>,
  entityTypeName?: string,
) {
  if (!match || !matchLinks) return undefined;

  const candidates = [
    match?.entity_type,
    match?.entityType,
    entityTypeName,
    match?.type?.name,
    match?.type,
  ];

  for (const candidate of candidates) {
    const direct = getMatchLinkValue(matchLinks, candidate);
    if (direct) return direct;
  }

  if (Object.keys(matchLinks).length === 1) {
    return matchLinks[Object.keys(matchLinks)[0]];
  }

  return undefined;
}

function getMatchLinkValue(matchLinks: Record<string, string>, candidate?: unknown) {
  if (!candidate) return undefined;

  const rawKey = String(candidate);
  const aliases = [rawKey, rawKey.toLowerCase(), rawKey.toUpperCase()];
  const normalizedAliases = [
    normalizeMatchLinkKey(rawKey),
    normalizeMatchLinkKey(rawKey.toLowerCase()),
    normalizeMatchLinkKey(rawKey.toUpperCase()),
  ];

  for (const alias of [...aliases, ...normalizedAliases]) {
    if (!alias) continue;
    const value = matchLinks[alias];
    if (value) return value;
  }

  return undefined;
}

function normalizeMatchLinkKey(key: string) {
  if (!key) return undefined;

  const normalized = key.toLowerCase().replace(/\s+/g, "_");
  const aliasMap = {
    lith: "lithology",
    lithology: "lithology",
    lithologies: "lithology",
    strat_name: "strat_name",
    strat_names: "strat_name",
    strat_name_concept: "concept",
    concept: "concept",
    concepts: "concept",
    interval: "interval",
    intervals: "interval",
    lith_att: "lith_att",
    lith_atts: "lith_att",
  };

  return aliasMap[normalized] ?? normalized;
}

function getMatchId(match: any) {
  return (
    match?.entity_id ??
    match?.macrostrat_terms_id ??
    match?.strat_name_id ??
    match?.lith_id ??
    match?.concept_id ??
    match?.lith_att_id ??
    match?.interval_id ??
    null
  );
}

function ExtractionInfo({
  data,
  matchComponent = null,
}: {
  data: EntityExt;
  matchComponent: MatchComponent;
}) {
  const children = data.children ?? [];

  return h("li.entity-row", [
    h(EntityTag, { data, matchComponent }),
    h.if(children.length > 0)([
      h(
        "ul.children",
        children.map((d) => h(ExtractionInfo, { data: d, matchComponent })),
      ),
    ]),
  ]);
}

function HighlightedText(props: { text: string; highlights: Highlight[] }) {
  const { text, highlights = [] } = props;
  const parts = [];
  let start = 0;

  const sortedHighlights = highlights.sort((a, b) => a.start - b.start);
  const deconflictedHighlights = sortedHighlights.map((highlight, i) => {
    if (i === 0) return highlight;
    const prev = sortedHighlights[i - 1];
    if (highlight.start < prev.end) {
      highlight.start = prev.end;
    }
    return highlight;
  });

  for (const highlight of deconflictedHighlights) {
    const { start: s, end, ...rest } = highlight;
    parts.push(text.slice(start, s));
    parts.push(h("span.highlight", { style: rest }, text.slice(s, end)));
    start = end;
  }
  parts.push(text.slice(start));
  return h("span", parts);
}

function normalizeColor(hex8) {
  const background = useDarkMode().isEnabled ? "#000000" : "#ffffff";

  const r = parseInt(hex8.slice(1, 3), 16);
  const g = parseInt(hex8.slice(3, 5), 16);
  const b = parseInt(hex8.slice(5, 7), 16);
  const a = parseInt(hex8.slice(7, 9), 16) / 255;

  const bgR = parseInt(background.slice(1, 3), 16);
  const bgG = parseInt(background.slice(3, 5), 16);
  const bgB = parseInt(background.slice(5, 7), 16);

  const blend = (fg, bg) => Math.round((1 - a) * bg + a * fg);

  const blendedR = blend(r, bgR);
  const blendedG = blend(g, bgG);
  const blendedB = blend(b, bgB);

  return (
    "#" +
    blendedR.toString(16).padStart(2, "0") +
    blendedG.toString(16).padStart(2, "0") +
    blendedB.toString(16).padStart(2, "0")
  );
}

function isHighlighted(id: number, selectedNodes: number[], nodes: any[]) {
  if (selectedNodes?.length === 0) return true;
  return (
    selectedNodes?.includes(id) ||
    nodes?.some(
      (node) =>
        selectedNodes?.includes(node.id) &&
        node.children.some((child) => child.id === id),
    )
  );
}
