import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import hyper from "@macrostrat/hyper";
import { OverlaysProvider } from "@blueprintjs/core";
import { FeedbackComponent, type GraphData } from "../src";
import { kgEntities, kgEntityTypes, kgRelationships, kgText } from "./kg-data";
import styles from "./kg-editor.stories.module.sass";

const h = hyper.styled(styles);

function KGExample({ view = false, empty = false, failSave = false }) {
  const [saved, setSaved] = useState<GraphData | null>(null);
  return h(
    OverlaysProvider,
    h("div.kg-story", [
      h("h2", "Entities with multiple parents"),
      h(
        "p",
        "Synthetic example: sandstone and shale both point to the same Quartz entity. Connections are unlabeled and not editable. Select an entity to review its type or match, then Save to inspect the payload.",
      ),
      h(FeedbackComponent, {
        entities: kgEntities,
        relationships: empty ? NO_EDGES : kgRelationships,
        text: kgText,
        entityTypes: kgEntityTypes,
        termsEndpoint: null,
        matchLinks: { lithology: "https://dev.macrostrat.org/lex/lithologies" },
        allowOverlap: true,
        panelHeight: "680px",
        view,
        async onSaveGraph(graph: GraphData) {
          if (failSave)
            throw new Error(
              "Example save failure. Your edits are still available.",
            );
          setSaved(graph);
        },
      }),
      h("details.kg-story-data", { open: true }, [
        h("summary", "Sample input data"),
        h(
          "pre",
          JSON.stringify(
            {
              entities: kgEntities,
              relationships: empty ? NO_EDGES : kgRelationships,
            },
            null,
            2,
          ),
        ),
      ]),
      h("details.kg-story-data", { open: true }, [
        h("summary", "Last saved graph"),
        h(
          "pre",
          saved == null
            ? "Edit an entity, then click Save."
            : JSON.stringify(saved, null, 2),
        ),
      ]),
    ]),
  );
}

const NO_EDGES = [];
export default {
  title: "Text extractions/Knowledge graph editor",
  component: KGExample,
} satisfies Meta<typeof KGExample>;

type Story = StoryObj<typeof KGExample>;
export const MultipleParents: Story = {};
export const ViewOnly: Story = { args: { view: true } };
export const StartWithoutRelationships: Story = { args: { empty: true } };
export const FailedSaveRetainsEdits: Story = { args: { failSave: true } };
