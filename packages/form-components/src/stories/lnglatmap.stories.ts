import { ComponentMeta } from "@storybook/react";
import { hyperStyled } from "@macrostrat/hyper";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import React, { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./stories.module.scss";
import { Point, LngLatMap, LngLatInputs } from "../components";
const h = hyperStyled(styles);

export default {
  title: "Geographic",
  component: LngLatMap,
  subcomponents: { LngLatInputs },
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {},
} as ComponentMeta<typeof LngLatMap>;

function roundCoordinates(p: Point) {
  let [long, lat] = p.geometry.coordinates;
  p.geometry.coordinates = [
    parseFloat(long.toPrecision(7)),
    parseFloat(lat.toPrecision(7)),
  ];
}

/* break state out and share it */
export function LngLatForm(props: {
  longitude: number;
  latitude: number;
  onChange: (p: Point) => void;
}) {
  const [point, setPoint] = useState<Point>({
    geometry: { coordinates: [props.longitude, props.latitude], type: "Point" },
    id: "",
    properties: {},
    type: "Feature",
  });

  const setPoint_ = (p: Point) => {
    roundCoordinates(p);
    setPoint(p);
  };

  useEffect(() => {
    props.onChange?.(point);
  }, [point]);

  return h("div", [
    h(LngLatMap, { point, setPoint: setPoint_ }),
    h("div.latlnginputs", [
      h(LngLatInputs, {
        point,
        setPoint: setPoint_,
      }),
    ]),
  ]);
}

LngLatForm.args = {
  longitude: -89,
  latitude: 43,
  onChange: (p: Point) => console.log(p),
};
