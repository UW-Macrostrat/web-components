//@ts-nocheck
import { hyperStyled } from "@macrostrat/hyper";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import React, { useEffect, useRef, useState } from "react";
import styles from "./map.module.scss";
import { FormGroup, NumericInput } from "@blueprintjs/core";

const h = hyperStyled(styles);

async function initializeMap(
  mapContainerRef: React.Ref<HTMLElement | string>,
  viewport: ViewPointI,
  setViewport: (v: ViewPointI) => void
) {
  var map = new mapboxgl.Map({
    container: mapContainerRef,
    style: "mapbox://styles/mapbox/streets-v11", // style URL
    center: [viewport.longitude, viewport.latitude], // starting position [lng, lat]
    zoom: viewport.zoom, // starting zoom
  });

  var nav = new mapboxgl.NavigationControl();

  map.addControl(nav);

  map.on("move", () => {
    const [zoom, latitude, longitude] = [
      map.getZoom(),
      map.getCenter().lat,
      map.getCenter().lng,
    ];
    setViewport({ longitude, latitude, zoom });
  });

  return map;
}

async function editModeMap(
  map: mapboxgl.Map,
  point: Point,
  changePoint: (e: FeaturesI) => void,
) {
  const Draw = new MapboxDraw({
    controls: { point: true, trash: true },
    displayControlsDefault: false,
  });
  map.addControl(Draw, "top-left");
  
  Draw.add(point);

  map.on("draw.create", changePoint);

  map.on("draw.update", changePoint);

  return Draw;
}

interface FeaturesI {
  features: Point[];
}

interface LngLatMapI {
  point: Point;
  setPoint: (p: Point) => void;
  width?: string;
  height?: string;
  disabled?:boolean;
}

interface ViewPointI {
  longitude: number;
  latitude: number;
  zoom: number;
}

export type PointCoords = [number, number];
export type PointGeom = { coordinates: PointCoords; type: string };

export interface Point {
  geometry: PointGeom;
  id: string | number;
  properties: object;
  type: string;
}

function LngLatMap(props: LngLatMapI) {
  const { point, setPoint, disabled = false } = props;
  const [viewport, setViewport] = useState<ViewPointI>({
    longitude: point.geometry.coordinates[0],
    latitude: point.geometry.coordinates[1],
    zoom: 1,
  });

  const [map, setMap] = useState<mapboxgl.Map>();

  const mapContainerRef = useRef(null);
  const drawRef = useRef();

  const changePoint = (e: FeaturesI) => {
    if(disabled)return;
    console.log("Change Point Triggered!");
    setPoint(e.features[0]);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapContainerRef.current == null) return;
    initializeMap(mapContainerRef.current, viewport, setViewport).then(
      (mapObj) => {
        setMap(mapObj);
      }
    );
    return () => {
      if (typeof map !== "undefined") {
        map.remove();
      }
    };
  }, [mapContainerRef]);

  useEffect(() => {
    if (typeof map === "undefined") return;
    if (typeof window === "undefined") return;

    editModeMap(map, point, changePoint, disabled).then((draw) => {
      drawRef.current = draw;
    });
    return () => {
      let Draw = drawRef.current;
      if (!map || !Draw) return;
      try {
        map.off("draw.create", changePoint);
        map.off("draw.update", changePoint);
        map.removeControl(Draw);
      } catch (error) {
        console.log(error);
      }
    };
  }, [point, map]);

  return h("div", [
    h("div.map-container", {
      ref: mapContainerRef,
      style: { width: props.width ?? "100%", height: props.height ?? "300px",pointerEvents: disabled? "none": "all" },
    }),
  ]);
}

interface LngLatInputsI extends LngLatMapI {
  disabled?: boolean;
}

function LngLatInputs(props: LngLatInputsI) {
  const { point, setPoint, disabled = false } = props;

  const [longitude, latitude] = point.geometry.coordinates;

  const onChangeLong = (e: number) => {
    if (e > 180 || e < -180) e = e / 10;
    const newPoint: Point = {
      geometry: { coordinates: [e, latitude], type: "Point" },
      id: "",
      properties: {},
      type: "Feature",
    };
    setPoint(newPoint);
  };

  const onChangeLat = (e: number) => {
    if (e > 90 || e < -90) e = e / 10;
    const newPoint: Point = {
      geometry: { coordinates: [longitude, e], type: "Point" },
      id: "",
      properties: {},
      type: "Feature",
    };
    setPoint(newPoint);
  };

  return h(React.Fragment, [
    h(FormGroup, { label: "Longitude", helperText: "-180 to 180" }, [
      h(NumericInput, {
        value: longitude,
        onValueChange: onChangeLong,
        min: -180,
        max: 180,
        disabled,
      }),
    ]),
    h(FormGroup, { label: "Latitude", helperText: "-90 to 90" }, [
      h(NumericInput, {
        value: latitude,
        onValueChange: onChangeLat,
        min: -90,
        max: 90,
        disabled,
      }),
    ]),
  ]);
}

export { initializeMap, editModeMap, LngLatMap, LngLatInputs };
