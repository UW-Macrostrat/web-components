import type { Meta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { ExpansionPanel, SubExpansionPanel } from ".";
import { LithologyList, Tag, TagField } from "../components/unit-details";
import { useAPIResult } from "@macrostrat/ui-components";
import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
});

function useMapInfo(lng, lat, z) {
  return useAPIResult(`/mobile/map_query_v2`, {
    lng,
    lat,
    z,
  });
}

export default {
  title: "Data components/Expansion panel",
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {},
  component: ExpansionPanelDemo,
} as Meta<any>;

const lat = 44.60085563149249;
const lng = -96.16783150353609;
const zoom = 3.9392171056922325;

export const Primary = {
  args: {},
};

function generateLoremContent(nParagraphs = 1) {
  return lorem
    .generateParagraphs(nParagraphs)
    .split("\n")
    .map((d) => h("p", d));
}

const loremContent = lorem.generateParagraphs(20).split("\n");
// Group into arrays of 2 paragraphs each
const groupedContent = [];
for (let i = 0; i < loremContent.length; i += 2) {
  groupedContent.push(loremContent.slice(i, i + 2).map((d) => h("p", d)));
}

function ExpansionPanelDemo() {
  const mapInfo = useMapInfo(lng, lat, zoom);

  if (mapInfo == null) {
    return null;
  }

  const macrostrat = mapInfo?.mapData[0]?.macrostrat;
  if (macrostrat == null) return null;
  const { liths = null } = macrostrat;

  if (!liths || liths.length == 0) return null;

  const lith_types = liths.map((d) => {
    return { name: d.lith_type ?? "other", color: "#888" };
  });

  const lithologies = liths.map((lith) => {
    return {
      ...lith,
      name: lith.lith,
      color: lith.color || "#000000",
    };
  });

  return h("div", [
    h(
      ExpansionPanel,
      {
        title: "Lithology",
      },
      [
        h(LithologyList, {
          label: "Matched lithologies",
          lithologies,
        }),
        h(TypesList, {
          label: "Facies",
          data: [
            { name: "marine", color: "#00f" },
            { name: "terrestrial", color: "#0a0" },
            { name: "other", color: "#888" },
          ],
        }),
      ],
    ),
    h(
      ExpansionPanel,
      {
        title: "Environments",
      },
      h(
        "p",
        "We have some truly exciting news to share about the enivronment for this rock unit.",
      ),
    ),
  ]);
}

function TypesList(props) {
  /** List for higher-level type/class attributes (e.g. environment types, economic types)
   * that might not have specific IDs
   */
  const { data, ...rest } = props;
  if (!data || data.length == 0) return null;

  return h(
    TagField,
    rest,
    data.map((d) => {
      let name = d.name;
      if (name == null || name == "") name = "other";
      return h(Tag, { name, color: d.color ?? "#888" });
    }),
  );
}

export function ExtremelyLongContent() {
  return h(
    "div",
    Array.from({ length: 10 }, () => generateLoremContent(2)).map(
      (content, i) => {
        return h(
          ExpansionPanel,
          {
            title: `Panel ${i + 1}`,
            expanded: i % 3 == 0,
          },
          content,
        );
      },
    ),
  );
}

export function NestedPanels() {
  return h(
    "div",
    Array.from({ length: 10 }, () => null).map((d, i) => {
      return h(
        ExpansionPanel,
        {
          title: `Panel ${i + 1}`,
          expanded: i % 3 == 0,
        },
        Array.from({ length: 5 }).map((d, j) => {
          return h(
            SubExpansionPanel,
            {
              title: `Panel ${i + 1}.${j + 1}`,
              expanded: j % 2 == 0,
            },
            generateLoremContent(2),
          );
        }),
      );
    }),
  );
}
