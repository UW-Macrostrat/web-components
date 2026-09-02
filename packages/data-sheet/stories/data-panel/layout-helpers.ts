import { createDataCard } from "../../src";
import { ReactNode, useMemo } from "react";
import h from "@macrostrat/hyper";
import { Tag } from "@blueprintjs/core";
import { CATEGORY_INTENT } from "./utils.ts";
import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum();

function blurbFor(id: number): ReactNode[] {
  const paragraphs = (id * 7) % 9; // 0–8
  const paras = lorem.generateParagraphs(paragraphs).split("\n");
  return paras.map((p) => h("p", p));
}

function MasonryCardContent({ data }) {
  const paras = useMemo(() => blurbFor(data.id), [data.id]);
  return h([
    h("span", { style: { fontWeight: 600 } }, data.name),
    h(
      Tag,
      { key: "c", minimal: true, intent: CATEGORY_INTENT[data.category] },
      data.category,
    ),
    paras,
  ]);
}

export const MasonryCard = createDataCard(MasonryCardContent, {
  style: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  className: "masonry-card",
});
