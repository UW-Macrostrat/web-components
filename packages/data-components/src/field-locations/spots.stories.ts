import type { Meta, StoryObj } from "@storybook/react";
import { SpotListingProps, SpotListing } from "./spots";

const spotExamples = {
  "Stillwater, OK": {
    id: 15943028648390,
    date: "2020-07-09T13:54:24.000Z",
    name: "LC-5",
    self: "https://strabospot.org/db/feature/15943028648390",
    time: "2020-07-09T13:54:24.000Z",
    notes: "East side outcrop. Sandstone over shale.",
    images: [
      {
        id: 15943029954933,
        self: "https://strabospot.org/pi/15943029954933",
        title: "Photo 1",
        width: 3264,
        height: 2448,
        caption: "Image of Spot.",
        annotated: true,
        image_type: "photo",
      },
    ],
    altitude: 279.36,
    gps_accuracy: 65,
    landing_page: "https://strabospot.org/search/?datasetid=15941489723784",
    modified_timestamp: 1635519218671,
  },
  "Extensive details": {
    id: 16741432423380,
    date: "2023-01-19T15:47:22+00:00",
    name: "2019-04",
    self: "https://strabospot.org/db/feature/16741432423380",
    time: "2023-01-19T15:47:22+00:00",
    notes:
      "Sat Jun 22 15:22:02 2019\n\nLarge cut bank on SW side. Multiple lake high stands and low stands represented \n\nUpper lake sediments fill paleochannel. Probably mainly silt.\n\nUnderlying gravels contain imbricated pebbles. Possible flame structures at base. Gravels largely pinch out at middle of long cut bank\n\nlower lake sediments have silt over silty sand with thin sandy layers and orange oxidized zones, maybe paleosols\n\nPoorly-sorted sands, gravels over clayey silt and thinly bedded silt and sand at base of section.\n\nNo tephra layers observed (other than reworked pumice in the gravels)\n\nWould need pmag or osl for age control",
    images: [
      {
        id: 16741448848711,
        self: "https://strabospot.org/pi/16741448848711",
        width: 1920,
        height: 1080,
        caption:
          "Relatively continuous white layer (darker moist) sampled as possible tephra  probably silt  2019-04B",
        annotated: false,
        image_type: "photo",
      },
      {
        id: 16741448542673,
        self: "https://strabospot.org/pi/16741448542673",
        width: 1920,
        height: 1080,
        caption: "Liquefaction features at downstream end",
        annotated: false,
        image_type: "photo",
      },
      {
        id: 16741448133453,
        self: "https://strabospot.org/pi/16741448133453",
        width: 1920,
        height: 1080,
        caption:
          "Gray silt layer in sand or tephra  surprisingly continuous many meters laterally  Sample of prominent white middle layer 2019-04",
        annotated: false,
        image_type: "photo",
      },
      {
        id: 16741448049918,
        self: "https://strabospot.org/pi/16741448049918",
        width: 1920,
        height: 1080,
        annotated: false,
        image_type: "photo",
      },
      {
        id: 16741447981961,
        self: "https://strabospot.org/pi/16741447981961",
        width: 1920,
        height: 1080,
        annotated: false,
        image_type: "photo",
      },
      {
        id: 16741447659899,
        self: "https://strabospot.org/pi/16741447659899",
        width: 1920,
        height: 1080,
        caption:
          "Downstream end of cut  possible tephra above scale  possible large flame or seismic disturbance left center",
        annotated: false,
        image_type: "photo",
      },
      {
        id: 16741447589526,
        self: "https://strabospot.org/pi/16741447589526",
        width: 1920,
        height: 1080,
        annotated: false,
        image_type: "photo",
      },
      {
        id: 16741447478067,
        self: "https://strabospot.org/pi/16741447478067",
        width: 9276,
        height: 2462,
        annotated: false,
        image_type: "photo",
      },
    ],
    samples: [
      {
        id: 16741471495875,
        label: "2019-04",
        sample_type: "field",
        material_type: "sediment",
        sample_id_name: "2019-04",
        sample_description:
          "Gray silt layer in sand or tephra  surprisingly continuous many meters laterally  Sample of prominent whit middle layer 2019-04",
        main_sampling_purpose: "geochemistry",
      },
      {
        id: 16741471993473,
        label: "2019-04-B",
        sample_type: "field",
        material_type: "sediment",
        sample_id_name: "2019-04-B",
        sample_description:
          "Relatively continuous white layer (darker moist) sampled as possible tephra  probably silt  2019-04B",
        main_sampling_purpose: "geochemistry",
      },
    ],
    landing_page: "https://strabospot.org/search/?datasetid=16741432425627",
    modified_timestamp: 1674147220387,
  },
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<SpotListingProps> = {
  title: "Field locations/StraboSpot featured spots",
  component: SpotListing,
  argTypes: {
    spot: {
      options: Object.keys(spotExamples),
      mapping: spotExamples,
    },
  },
};

export default meta;

type Story = StoryObj<SpotListingProps>;

export const Primary: Story = {
  args: {
    spot: spotExamples["Stillwater, OK"],
  },
};
