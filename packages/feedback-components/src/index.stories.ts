import { Meta } from "@storybook/react";
import { FeedbackComponent } from ".";

export default {
  title: "Feedback components/FeedbackComponent",
  component: FeedbackComponent,
} as Meta;

const data1 = {
  content:
    "Daven is currently doing all of Macrostrat's user interface development.",
  labelCategories: [
    {
      id: "person",
      text: "Person",
      color: "#8888FF",
      borderColor: "#8888AA",
    },
    {
      id: "task",
      text: "Task",
      color: "#2288FF",
      borderColor: "#2288AA",
    },
  ],
  labels: [
    {
      id: "t1",
      categoryId: "person",
      startIndex: 0,
      endIndex: 5,
    },
    {
      id: "t2",
      categoryId: "task",
      startIndex: 45,
      endIndex: 71,
    },
  ],
  connectionCategories: [
    {
      id: "does",
      text: "does everything",
    },
  ],
  connections: [
    {
      id: "l1",
      categoryId: "does",
      fromId: "t1", // Label's id
      toId: "t2", // Label's id
    },
  ],
};

export const Basic = { args: { data: data1 } };

const data2 = {
  content:
    "The Noonday Formation contains stromatolitic dolomite and crystal fans.",
  labelCategories: [
    {
      id: "unit",
      text: "Geologic unit",
      color: "#8888FF",
      borderColor: "#8888AA",
    },
    {
      id: "lith",
      text: "Lithology",
      color: "#2288FF",
      borderColor: "#2288AA",
    },
    {
      id: "lith_att",
      text: "Attribute",
      color: "#44AACC",
      borderColor: "#44AACC",
    },
  ],
  labels: [
    {
      id: "t3",
      categoryId: "lith_att",
      startIndex: 31,
      endIndex: 44,
    },
    {
      id: "t1",
      categoryId: "unit",
      startIndex: 4,
      endIndex: 21,
    },

    {
      id: "t2",
      categoryId: "lith",
      startIndex: 45,
      endIndex: 53,
    },
    {
      id: "t4",
      categoryId: "lith_att",
      startIndex: 58,
      endIndex: 70,
    },
  ],
  connectionCategories: [
    {
      id: "contains",
      text: "contains",
    },
    {
      id: "describes",
      text: "describes",
    },
  ],
  connections: [
    {
      id: "l0",
      categoryId: "describes",
      fromId: "t3", // Label's id
      toId: "t2", // Label's id
    },
    {
      id: "l1",
      categoryId: "contains",
      fromId: "t1", // Label's id
      toId: "t2", // Label's id
    },
    {
      id: "l2",
      categoryId: "contains",
      fromId: "t1", // Label's id
      toId: "t4", // Label's id
    },

  ],
};

export const GeologicFormation = { args: { data: data2}}

const content = `The Barstow Formation is well-known for its fossil mammals
and is the type area for many species that define the Barstovian Land Mammal Age
(Wood et al., 1941; Tedford et al., 1987). It also contains a variety of mammal tracks,
including those of camels, antelopes, cats, dogs, bear-dogs, birds, artiodactyls,
and proboscidians (Alf, 1966; Reynolds and Woodburne, 2001; Reynolds, 2004).
These tracks were commonly made on mud flats interpreted as lake shoreline deposits.
The resulting mudstones are relatively friable, but when covered by resistant
lithologies such as tuff, tuffaceous sandstone, or limestone, natural casts of
the tracks are preserved on the undersides of the beds (Alf, 1966).
Tracks are also found on the upper surfaces of resistant beds such as
tuff and tuffaceous sandstone (R. Reynolds, written comm., 2006).`;

// Replace newlines with spaces
const content1 = content.replace(/\n/g, " ");

// Karen J. Houck, and Martin G. Lockley Marco Avanzini ,
// A Survey of Tetrapod Tracksites Preserved in Pyroclastic Sediments,
// with Special Reference to Footprints of Hominids, Other Mammals and Birds, Ichnos, 16(1-2), 2009, doi: 10.1080/10420940802470870

export const BarstowFormation = {
  args: {
    data: {
      content: content1,
      labelCategories: [
        // {
        //   id: "stratigrapic-name",
        //   text: "Stratigraphic name",
        //   color: "#8888FF",
        //   borderColor: "#8888AA",
        // },
        // {
        //   id: "lithology",
        //   text: "Lithology",
        //   color: "#2288FF",
        //   borderColor: "#2288AA",
        // },
        // {
        //   id: "location",
        //   text: "Location",
        //   color: "#FF8888",
        //   borderColor: "#AA8888",
        // },
        // {
        //   id: "interpretation",
        //   text: "Interpretation",
        //   color: "#88FF88",
        //   borderColor: "#88AA88",
        // },
      ],
      labels: [
        // {
        //   id: "t1",
        //   categoryId: "stratigraphic-name",
        //   startIndex: 4,
        //   endIndex: 18,
        // },
        // {
        //   id: "t2",
        //   categoryId: "lithology",
        //   startIndex: 233,
        //   endIndex: 238,
        // },
        // {
        //   id: "t3",
        //   categoryId: "location",
        //   startIndex: 241,
        //   endIndex: 254,
        // },
        // {
        //   id: "t4",
        //   categoryId: "interpretation",
        //   startIndex: 255,
        //   endIndex: 264,
        // },
      ],
      connectionCategories: [
        // {
        //   id: "is",
        //   text: "is",
        // },
        // {
        //   id: "contains",
        //   text: "contains",
        // },
        // {
        //   id: "interpreted",
        //   text: "is interpreted as",
        // },
      ],
      connections: [
        // {
        //   id: "l1",
        //   categoryId: "contains",
        //   fromId: "t1",
        //   toId: "t2",
        // },
        // {
        //   id: "l2",
        //   categoryId: "is",
        //   fromId: "t2",
        //   toId: "t3",
        // },
        // {
        //   id: "l3",
        //   categoryId: "interpreted",
        //   fromId: "t3",
        //   toId: "t4",
        // },
      ],
    },
  },
};
