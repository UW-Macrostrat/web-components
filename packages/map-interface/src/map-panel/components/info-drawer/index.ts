import hyper from "@macrostrat/hyper";
import { LocationPanel } from "@macrostrat/map-interface";
import { MacrostratLinkedData } from "./macrostrat-linked";
import { Physiography } from "./physiography";
import styles from "./main.module.styl";
import { LoadingArea } from "../transitions";
import { RegionalStratigraphy } from "./reg-strat";
import { XddExpansion } from "./xdd-panel";
import { useAPIResult } from "@macrostrat/ui-components";
// import { apiV2Prefix, gddDomain } from "@macrostrat-web/settings";
const apiV2Prefix = `https://dev.macrostrat.org/api/v2`;
const gddDomain = `https://xdd.wisc.edu`;

const h = hyper.styled(styles);

export function InfoDrawer(props) {
  const {
    className,
    position,
    zoom,
    setSelectedLocation,
    children = null,
  } = props;

  const { lat, lng } = position;

  const mapInfo = fetchMapInfo(lng, lat, zoom);
  const columnInfo = fetchColumnInfo(lng, lat);
  const fossilInfo = fetchFossilInfo(lng, lat);
  const xddInfo = fetchXddInfo(mapInfo?.mapData?.[0]?.macrostrat?.strat_names);

  const fetchingMapInfo = mapInfo == null;

  return h(
    LocationPanel,
    {
      className,
      position,
      elevation: mapInfo?.elevation,
      zoom,
      onClose: () => setSelectedLocation(null),
      loading: mapInfo == null,
      showCopyPositionButton: true,
      contentContainer: "div.infodrawer-content-holder",
    },
    [
      h(
        LoadingArea,
        { loaded: !fetchingMapInfo, className: "infodrawer-content" },
        h.if(!fetchingMapInfo)(InfoDrawerMainPanel, {
          mapInfo,
          columnInfo,
          xddInfo,
        }),
      ),
      children,
    ],
  );
}

function InfoDrawerMainPanel({ mapInfo, columnInfo, xddInfo }) {
  if (!mapInfo || !mapInfo.mapData) {
    return null;
  }

  let source =
    mapInfo && mapInfo.mapData && mapInfo.mapData.length
      ? mapInfo.mapData[0]
      : {
          name: null,
          descrip: null,
          comments: null,
          liths: [],
          b_int: {},
          t_int: {},
          ref: {},
        };

  return h([
    h(RegionalStratigraphy, {
      mapInfo,
      columnInfo,
    }),
    // h(FossilCollections, { data: pbdbData, expanded: true }),
    h(MacrostratLinkedData, {
      mapInfo,
      bedrockMatchExpanded: true,
      source,
    }),
    h.if(xddInfo)(XddExpansion, { xddInfo }),
    h(Physiography, { mapInfo }),
  ]);
}

function fetchMapInfo(lng, lat, z) {
  return useAPIResult(`${apiV2Prefix}/mobile/map_query_v2`, {
    lng,
    lat,
    z,
  })?.success?.data;
}

function fetchColumnInfo(lng, lat) {
  return useAPIResult(`${apiV2Prefix}/columns`, {
    lat,
    lng,
    response: "long",
  })?.success?.data?.[0];
}

function fetchXddInfo(stratNames) {
  return useAPIResult(`${gddDomain}/api/v1/snippets`, {
    article_limit: 20,
    term: stratNames?.map((d) => d.rank_name).join(","),
  })?.success?.data;
}

function fetchFossilInfo(lng, lat) {
  return useAPIResult(`http://localhost:5000/fossils`, {
    // fix when api changes
    lat,
    lng,
  })?.success?.data;
}
