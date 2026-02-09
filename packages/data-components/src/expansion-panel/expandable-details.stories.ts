import type { Meta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { ExpandableDetailsPanel } from ".";
import { LithologyList, Tag, TagField } from "../components/unit-details";
import { Box, useAPIResult } from "@macrostrat/ui-components";

function useMapInfo(lng, lat, z) {
  return useAPIResult(`/mobile/map_query_v2`, {
    lng,
    lat,
    z,
  });
}

export default {
  title: "Data components/Expandable details",
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {},
  component: ExpandableDetailsDemo,
} as Meta<any>;

const lat = 44.60085563149249;
const lng = -96.16783150353609;
const zoom = 3.9392171056922325;

export const Primary = {
  args: {},
};

function ExpandableDetailsDemo() {
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
      ExpandableDetailsPanel,
      {
        headerElement: h(TypesList, {
          label: "Lithology",
          data: lith_types,
          row: true,
        }),
      },
      h(LithologyList, {
        label: "Matched lithologies",
        lithologies,
      }),
    ),
    h(
      ExpandableDetailsPanel,
      {
        headerElement: h(TypesList, {
          label: "Facies",
          data: [
            { name: "marine", color: "#00f" },
            { name: "terrestrial", color: "#0a0" },
            { name: "other", color: "#888" },
          ],
        }),
      },
      "Facies are user-provided lists of rock unit information",
    ),
    h(
      ExpandableDetailsPanel,
      {
        headerElement: h("h2", "Environments"),
      },
      "We have some truly exciting news to share about the enivronment for this rock unit.",
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
