import type { Meta } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { xDDExpansionPanel } from ".";
import { useAPIResult } from "@macrostrat/ui-components";

function useMapInfo(lng, lat, z) {
  return useAPIResult(`/mobile/map_query_v2`, {
    lng,
    lat,
    z,
  });
}

function useXddInfo(stratNames) {
  return useAPIResult(`https://xdd.wisc.edu/api/v1/snippets`, {
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
  args: {
    expanded: true,
    nestedExpanded: true,
  },
};

export const DetailsExpanded = {
  args: {
    expanded: true,
    nestedExpanded: true,
    detailsExpanded: true,
  },
};

function XDDInfoExample(props) {
  const mapInfo = useMapInfo(lng, lat, zoom);
  const xddInfo = useXddInfo(mapInfo?.mapData?.[0]?.macrostrat?.strat_names);
  if (xddInfo == null || mapInfo == null) {
    return null;
  }

  return h(xDDExpansionPanel, { data: xddInfo, ...props });
}
