//https://dev.macrostrat.org/api/v2/mobile/map_query_v2?lng=-105.2931&lat=40.0872&z=11.2

import h from "@macrostrat/hyper";
import { Meta, StoryObj } from "@storybook/react-vite";
import { useAPIResult } from "@macrostrat/ui-components";
import { Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import {
  UnitDetailsPanelProps,
  IntervalProportions,
  type IntervalProportionsProps,
  AgeField,
  AgeRange,
} from "../src";

function MapQueryStoryBase(
  args: Omit<IntervalProportionsProps, "unit"> & {
    lng: number;
    lat: number;
    zoom: number;
  },
) {
  const { lng, lat, zoom, ...rest } = args;
  // Need to get column units first in order to set up navigation
  const res = useAPIResult("/mobile/map_query_v2", {
    lng: args.lng,
    lat: args.lat,
    z: args.zoom,
  });
  const mapData = res?.mapData?.[0];

  const macrostratMapData = mapData?.macrostrat;

  if (mapData == null) return h(Spinner);

  const u0 = {
    b_int_id: mapData.b_int?.int_id,
    t_int_id: mapData.t_int?.int_id,
    b_age: mapData.b_age,
    t_age: mapData.t_age,
  };

  let u1 = null;
  if (macrostratMapData.b_int != null) {
    u1 = {
      b_int_id: macrostratMapData.b_int?.int_id,
      t_int_id: macrostratMapData.t_int?.int_id,
      b_age: macrostratMapData.b_age,
      t_age: macrostratMapData.t_age,
    };
  }

  return h("div", [
    h(IntervalProportions, {
      unit: u0,
      ...rest,
    }),
    h(AgeField, {
      unit: u0,
      row: false,
    }),
    h.if(u1 != null)([
      h("h3", "Macrostrat data"),
      h(IntervalProportions, {
        unit: u1,
        ...rest,
      }),
      h(AgeField, {
        unit: u1,
        row: false,
      }),
    ]),
  ]);
}

const meta: Meta<UnitDetailsPanelProps> = {
  title: "Column views/Unit details/Age intervals (map)",
  component: MapQueryStoryBase,
  args: {
    lng: -105.2931,
    lat: 40.0872,
    zoom: 11.2,
  },
};

export default meta;

export const Primary: StoryObj<typeof MapQueryStoryBase> = {
  args: {},
};

export const ShowProportions: StoryObj<typeof MapQueryStoryBase> = {
  args: {
    showProportions: true,
  },
};

export const ShowProportionsWithAgeRange: StoryObj<typeof MapQueryStoryBase> = {
  args: {
    showProportions: true,
    showAgeRange: true,
  },
};

export const WeatherbyFormation = {
  args: {
    // https://dev.macrostrat.org/api/v2/mobile/map_query_v2?lng=-117.499&lat=44.427&z=6.9
    lng: -117.499,
    lat: 44.427,
    zoom: 6.9,
    showProportions: true,
  },
};

export const WeatherbyFormationWithAgeRanges = {
  args: {
    // https://dev.macrostrat.org/api/v2/mobile/map_query_v2?lng=-117.499&lat=44.427&z=6.9
    lng: -117.499,
    lat: 44.427,
    zoom: 6.9,
    showProportions: true,
    showAgeRange: true,
    multiLine: true,
  },
};

export const LivingstonGroup = {
  args: {
    // https://dev.macrostrat.org/api/v2/mobile/map_query_v2?lng=-110.819&lat=46.048&z=6.7
    lng: -110.819,
    lat: 46.048,
    zoom: 6.7,
    showProportions: true,
    showAgeRange: true,
    multiLine: true,
  },
};
