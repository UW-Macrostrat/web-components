import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Tag } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { MapboxMapProvider } from "@macrostrat/mapbox-react";
import mapboxgl from "mapbox-gl";
import { useMemo, useState } from "react";
import { createMapPool, MapPoolProvider, MapView } from "../src";
import styles from "./map-pool.stories.module.sass";

const h = hyper.styled(styles);

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

/** Two "pages", each mounting its own `MapView` as a client-side route would.
 * With a pool, switching pages keeps one map; without, each switch builds a
 * new one (a new billed map load). The tag counts maps constructed. */
function PageSwitcher({ pooled }: { pooled: boolean }) {
  const pool = useMemo(() => createMapPool(), []);
  const [page, setPage] = useState(0);
  const [mapIDs] = useState(() => new WeakMap<mapboxgl.Map, number>());
  const [mapCount, setMapCount] = useState(0);
  const [currentID, setCurrentID] = useState<number | null>(null);

  const onMapLoaded = (map: mapboxgl.Map) => {
    if (!mapIDs.has(map)) {
      mapIDs.set(map, mapCount + 1);
      setMapCount(mapCount + 1);
    }
    setCurrentID(mapIDs.get(map) ?? null);
  };

  let poolProp: null | undefined = null;
  if (pooled) poolProp = undefined;

  const view = h(Page, {
    key: page,
    page: PAGES[page],
    pool: poolProp,
    onMapLoaded,
  });

  return h(MapPoolProvider, { pool }, [
    h("div.map-pool-story", [
      h("div.controls", [
        h(
          ButtonGroup,
          PAGES.map((p, i) =>
            h(
              Button,
              { key: p.name, active: i == page, onClick: () => setPage(i) },
              p.name,
            ),
          ),
        ),
        h(Tag, { large: true }, `Map #${currentID} · ${mapCount} constructed`),
      ]),
      view,
    ]),
  ]);
}

/** Every page has its own provider, as separate routes would. */
function Page({ page, pool, onMapLoaded }) {
  return h(
    MapboxMapProvider,
    h(MapView, {
      style: page.style,
      mapPosition: page.mapPosition,
      mapboxToken,
      pool,
      onMapLoaded,
    }),
  );
}

const PAGES = [
  {
    name: "Streets",
    style: "mapbox://styles/mapbox/streets-v12",
    mapPosition: { camera: { lat: 43.07, lng: -89.4, altitude: 300000 } },
  },
  {
    name: "Satellite",
    style: "mapbox://styles/mapbox/satellite-v9",
    mapPosition: { camera: { lat: 36.1, lng: -112.1, altitude: 200000 } },
  },
  {
    name: "Light",
    style: "mapbox://styles/mapbox/light-v11",
    mapPosition: { camera: { lat: 40, lng: -100, altitude: 5000000 } },
  },
];

const meta: Meta<typeof PageSwitcher> = {
  title: "Map interface/Map pool",
  component: PageSwitcher,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof PageSwitcher>;

export const Pooled: Story = { args: { pooled: true } };

export const NotPooled: Story = { args: { pooled: false } };
