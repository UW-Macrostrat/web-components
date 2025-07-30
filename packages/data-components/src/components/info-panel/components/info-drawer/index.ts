import hyper from "@macrostrat/hyper";
import { LocationPanel } from "@macrostrat/map-interface";
import { MacrostratLinkedData } from "./macrostrat-linked";
import { Physiography } from "./physiography";
import styles from "./main.module.styl";
import { LoadingArea } from "../transitions";
import { RegionalStratigraphyInner } from "../../reg-strat";
import { XddExpansion } from "./xdd-panel";
import { useAPIResult } from "@macrostrat/ui-components";
import { FossilCollections } from "./fossil-collections";

const apiV2Prefix = `https://dev.macrostrat.org/api/v2`;
const gddDomain = `https://xdd.wisc.edu`;
const paleobioDomain = `https://paleobiodb.org`;

const h = hyper.styled(styles);

export function RegionalStratigraphy({lat, lng, zoom, columnURL}) {
  const mapInfo = fetchMapInfo(lng, lat, zoom);
  const columnInfo = fetchColumnInfo(lng, lat);

  if(!mapInfo || !mapInfo.mapData) {
    return null;
  }

  return RegionalStratigraphyInner({
    mapInfo,
    columnInfo,
    columnURL
  });
}

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

  console.log("fossilInfo", fossilInfo);

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
          fossilInfo,
        }),
      ),
      children,
    ],
  );
}

function InfoDrawerMainPanel({ mapInfo, columnInfo, xddInfo, fossilInfo }) {
  if (!mapInfo || !mapInfo.mapData) {
    return null;
  }

  console.log("InfoDrawerMainPanel", fossilInfo);

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
    h(FossilCollections, { data: fossilInfo, expanded: true }),
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
  const collectionResponse = useAPIResult(
    `${paleobioDomain}/data1.2/colls/list.json?lngmin=${lng - 0.1}&lngmax=${lng + 0.1}&latmin=${lat - 0.1}&latmax=${lat + 0.1}`,
  )?.records;

  const occurrences = useAPIResult(
    `${paleobioDomain}/data1.2/occs/list.json?lngmin=${lng - 0.1}&lngmax=${lng + 0.1}&latmin=${lat - 0.1}&latmax=${lat + 0.1}`,
  )?.records;

  if (!collectionResponse || !occurrences) {
    return null;
  }

  try {
    return collectionResponse.map((col) => {
      col.occurrences = [];
      occurrences.forEach((occ) => {
        if (occ.cid === col.oid) {
          col.occurrences.push(occ);
        }
      });
      return col;
    });
  } catch (error) {
    console.log(error);
    return [];
  }
}
