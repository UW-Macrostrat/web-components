import h from "@macrostrat/hyper";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

import { Meta } from "@storybook/react-vite";
import { ColumnNavigationMap } from ".";
import { useState } from "react";

function ColumnNavigationMapExt(props) {
  return h(ColumnNavigationMap, {
    style: { width: "800px", height: "600px" },
    padding: 100,
    accessToken: mapboxToken,
    ...props,
  });
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Maps/Column navigation",
  component: ColumnNavigationMapExt,
  description: "Cross section creation map",
} as Meta<typeof ColumnNavigationMap>;

export const ColumnNavigation = {
  args: {
    showTriangulation: false,
  },
};

export const ColumnNavigationFilterableByIds = {
  args: {
    showTriangulation: false,
    columnIDs: [1,2,3,4,5,6,7,8,9,10],
  },
};

const colData = [
  {
    "id": 1,
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [-86.9992, 34.6946],
          [-86.9041, 35.4015],
          [-86.5971, 35.4513],
          [-86.1652, 35.0947],
          [-86.1746, 34.7447],
          [-86.5036, 34.4262],
          [-86.6318, 34.4244],
          [-86.9992, 34.6946]
        ]
      ]
    },
    "properties": {
      "col_id": 2,
      "col_name": "Madison Co, Alabama",
      "col_group": "Southern Appalachians",
      "col_group_id": 17,
      "group_col_id": "1.00",
      "lat": "34.85300",
      "lng": "-86.56200",
      "col_area": "6345.4",
      "project_id": 1,
      "col_type": "column",
      "refs": [1],
      "max_thick": 2559,
      "max_min_thick": 2411,
      "min_min_thick": 529,
      "b_age": 1550,
      "t_age": 322.15,
      "b_int_name": "Calymmian",
      "t_int_name": "Morrowan",
      "pbdb_collections": 3,
      "lith": [
        { "name": "mudstone", "type": "siliciclastic", "class": "sedimentary", "prop": 0.0041, "lith_id": 7 },
        { "name": "shale", "type": "siliciclastic", "class": "sedimentary", "prop": 0.2598, "lith_id": 8 },
        { "name": "siltstone", "type": "siliciclastic", "class": "sedimentary", "prop": 0.0107, "lith_id": 9 },
        { "name": "sandstone", "type": "siliciclastic", "class": "sedimentary", "prop": 0.0322, "lith_id": 10 },
        { "name": "limestone", "type": "carbonate", "class": "sedimentary", "prop": 0.4093, "lith_id": 30 },
        { "name": "dolomite", "type": "carbonate", "class": "sedimentary", "prop": 0.1132, "lith_id": 31 },
        { "name": "coal", "type": "organic", "class": "sedimentary", "prop": 0.0057, "lith_id": 38 },
        { "name": "chert", "type": "chemical", "class": "sedimentary", "prop": 0.0674, "lith_id": 45 },
        { "name": "granite", "type": "plutonic", "class": "igneous", "prop": 0.0379, "lith_id": 53 },
        { "name": "rhyolite", "type": "volcanic", "class": "igneous", "prop": 0.0076, "lith_id": 64 },
        { "name": "ash", "type": "volcanic", "class": "igneous", "prop": 0.0107, "lith_id": 75 },
        { "name": "quartz arenite", "type": "siliciclastic", "class": "sedimentary", "prop": 0.0207, "lith_id": 169 },
        { "name": "sublitharenite", "type": "siliciclastic", "class": "sedimentary", "prop": 0.0207, "lith_id": 199 }
      ],
      "environ": [
        { "name": "marine", "type": "", "class": "marine", "prop": 0.0476, "environ_id": 38 },
        { "name": "fluvial-deltaic indet.", "type": "fluvial", "class": "non-marine", "prop": 0.0476, "environ_id": 57 },
        { "name": "inferred marine", "type": "", "class": "marine", "prop": 0.9048, "environ_id": 93 }
      ],
      "econ": [],
      "t_units": 22,
      "t_sections": 6
    }
  },
];

export const ColumnNavigationFilterableByGeojson = {
  args: {
    showTriangulation: false,
    columns: colData,
  },
};


export const nonStandardProjectInProcess = {
  args: {
    padding: 100,
    projectID: 10,
    inProcess: true,
    showTriangulation: false,
    mapPosition: {
      camera: {
        lng: -72,
        lat: 44,
        altitude: 600000,
      },
    },
  },
};

export const DeepSea = {
  args: {
    padding: 100,
    projectID: 4,
    inProcess: true,
    showTriangulation: false,
    center: [0, 0],
    zoom: 2,
    mapPosition: null,
  },
};

export const eODP = {
  args: {
    projectID: 3,
    inProcess: true,
  },
};

export const showTriangulation = {
  description: "Show the triangulation used for keyboard navigation",
  args: {
    showTriangulation: true,
    columnColor: "#1fff53",
    triangulationColor: "#9a33bb",
  },
};

export const onlyPhysicalBasemap = {
  args: {
    mapStyle: "mapbox://styles/mapbox/outdoors-v11",
    showLabels: true,
    showAdmin: false,
    showRoads: false,
  },
};

export function ControlledColumnNavigation() {
  const [selectedColumn, setSelectedColumn] = useState(157);
  const [hoveredColumn, setHoveredColumn] = useState(null);

  return h("div.controlled-navigation", [
    h(ColumnNavigationMapExt, {
      selectedColumn,
      hoveredColumn,
      onSelectColumn: setSelectedColumn,
      onHoverColumn: setHoveredColumn,
    }),
    h("div.column-info", [
      h("h3", "Selected column"),
      h("p", selectedColumn),
      h("h3", "Hovered column"),
      h("p", hoveredColumn),
    ]),
  ]);
}
