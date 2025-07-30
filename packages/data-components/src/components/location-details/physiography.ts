import h from "@macrostrat/hyper";
import { ExpansionPanel } from "@macrostrat/map-interface";

export function Physiography(props) {
  const { mapInfo } = props;

  if (!mapInfo || !mapInfo.regions) {
    return null;
  }

  const { regions } = mapInfo;

  return h.if(regions.length > 0)(
    ExpansionPanel,
    {
      classes: { root: "regional-panel" },
      title: "Physiography",
      expanded: true,
    },
    [
      regions.map((region, i) => {
        return h("div.region", { key: i }, [
          h("h3", [region.name]),
          h("p.region-group", [region.boundary_group]),
          h("p.region-description", [region.descrip]),
        ]);
      }),
    ],
  );
}