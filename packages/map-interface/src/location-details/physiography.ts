import h from "@macrostrat/hyper";
import { ExpansionPanel } from "@macrostrat/data-components";

export function Physiography(props) {
  const { mapInfo, expanded = true } = props;

  if (!mapInfo || !mapInfo.regions) {
    return null;
  }

  const { regions } = mapInfo;

  return h.if(regions.length > 0)(
    ExpansionPanel,
    {
      classes: { root: "regional-panel" },
      title: "Physiography",
      expanded,
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
