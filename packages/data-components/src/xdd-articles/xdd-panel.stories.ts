import type { Meta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { xDDExpansion } from ".";
import { useAPIResult } from "@macrostrat/ui-components";

const gddDomain = `https://xdd.wisc.edu`;

function useMapInfo(lng, lat, z) {
  return useAPIResult(`/mobile/map_query_v2`, {
    lng,
    lat,
    z,
  });
}

function useXddInfo(stratNames) {
  return useAPIResult(`${gddDomain}/api/v1/snippets`, {
    article_limit: 20,
    term: stratNames?.map((d) => d.rank_name).join(","),
  });
}

export default {
  title: "Data components/xDD panel",
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {},
  component: XDDInfoExample,
} as Meta<any>;

const lat = 44.60085563149249;
const lng = -96.16783150353609;
const zoom = 3.9392171056922325;

export const Primary = {
  args: {},
};

function XDDInfoExample() {
  const mapInfo = useMapInfo(lng, lat, zoom);
  const xddInfo = useXddInfo(mapInfo?.mapData?.[0]?.macrostrat?.strat_names);
  if (xddInfo == null || mapInfo == null) {
    return null;
  }

  return h(xDDExpansion, { xddInfo, expanded: true, nestedExpanded: true });
}
