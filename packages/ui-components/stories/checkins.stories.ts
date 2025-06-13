import { ComponentStory, ComponentMeta } from "@storybook/react";
import h from "@macrostrat/hyper";
import { CreateCheckins } from "../src";

export default {
  title: "UI components/Create Checkins",
  component: CreateCheckins,
  argTypes: {
    result: {
      control: { type: "array" },
      description: "Array of checkin objects to display",
    },
    mapRef: {
      control: { type: "object" },
      description: "Reference to the map instance",
    },
    setInspectPosition: {
      control: { type: "function" },
      description: "Function to set the position for inspection",
    },
  },
} as ComponentMeta<typeof CreateCheckins>;

const Template: ComponentStory<typeof CreateCheckins> = (args) =>
  h(CreateCheckins, args);

const checkinWithImage = {
  "checkin_id": 3570,
  "person_id": 1,
  "first_name": "John",
  "last_name": "Czaplewski",
  "notes": "Hollow Stone",
  "rating": 5,
  "lng": -1.1409402167851113,
  "lat": 52.9515549935913,
  "near": "Nottingham, United Kingdom",
  "created": "April 30, 2018",
  "added": "April 30, 2018",
  "photo": 9488,
  "likes": "6",
  "comments": 0,
  "liked": false,
  "status": 1,
  "observations": [
    {
      "obs_id": 7840,
      "photo": 9489,
      "lng": -1.1406867737981656,
      "lat": 52.9513976411644,
      "orientation": {},
      "rocks": {
        "strat_name": {
          "strat_name_long": "Chester Formation",
          "strat_name_id": 94571,
          "strat_name": "Chester",
          "b_age": 251.2,
          "b_period": "Triassic",
          "t_age": 247.2,
          "t_period": "Triassic",
          "parent": "New Red Sandstone Supergroup",
          "ref_id": 27
        },
        "map_unit": {
          "map_id": 2032435,
          "unit_name": "Triassic Rocks (Undifferentiated)",
          "distance": 0,
          "int_name": "Triassic"
        },
        "liths": [
          {
            "class": "sedimentary",
            "color": "255, 213, 0, 0.5",
            "fill": 607,
            "group": "sandstones",
            "lith_id": 10,
            "name": "sandstone",
            "type": "siliciclastic",
            "count": 1,
            "attributes": []
          }
        ],
        "interval": {
          "int_id": 72,
          "name": "Olenekian",
          "abbrev": null,
          "t_age": 247.2,
          "b_age": 251.2,
          "int_type": "age",
          "color": "176, 81, 165, 0.5"
        },
        "notes": "Chester Formation used to be called the Castle Rock Formation"
      },
      "fossils": {},
      "minerals": {},
      "comments": 0,
      "age_est": {
        "int_id": 72,
        "name": "Olenekian",
        "color": "#B051A5",
        "b_age": 251.2,
        "t_age": 247.2
      }
    },
    {
      "obs_id": 7841,
      "photo": 9490,
      "lng": -1.1409821096540327,
      "lat": 52.9515165096043,
      "orientation": {},
      "rocks": {
        "strat_name": {
          "strat_name_long": "Chester Formation",
          "strat_name_id": 94571,
          "strat_name": "Chester",
          "b_age": 251.2,
          "b_period": "Triassic",
          "t_age": 247.2,
          "t_period": "Triassic",
          "parent": "New Red Sandstone Supergroup",
          "ref_id": 27
        },
        "map_unit": {
          "map_id": 2032435,
          "unit_name": "Triassic Rocks (Undifferentiated)",
          "distance": 0,
          "int_name": "Triassic"
        },
        "liths": [
          {
            "class": "sedimentary",
            "color": "255, 213, 0, 0.5",
            "fill": 607,
            "group": "sandstones",
            "lith_id": 10,
            "name": "sandstone",
            "type": "siliciclastic",
            "_id": "activeLithology",
            "count": 1,
            "_rev": "26-d12a756ed538c9a2739ef923f5c06769",
            "attributes": [
              {
                "lith_att_id": 165,
                "name": "chossy",
                "type": "lithology",
                "t_units": 0
              }
            ]
          }
        ],
        "interval": {
          "int_id": 72,
          "name": "Olenekian",
          "abbrev": null,
          "t_age": 247.2,
          "b_age": 251.2,
          "int_type": "age",
          "color": "176, 81, 165, 0.5"
        },
        "notes": ""
      },
      "fossils": {},
      "minerals": {},
      "comments": 0,
      "age_est": {
        "int_id": 72,
        "name": "Olenekian",
        "color": "#B051A5",
        "b_age": 251.2,
        "t_age": 247.2
      }
    },
    {
      "obs_id": 7842,
      "photo": 9491,
      "lng": -1.1409309722507714,
      "lat": 52.9515056114062,
      "orientation": {},
      "rocks": {
        "strat_name": {
          "strat_name_long": "Chester Formation",
          "strat_name_id": 94571,
          "strat_name": "Chester",
          "b_age": 251.2,
          "b_period": "Triassic",
          "t_age": 247.2,
          "t_period": "Triassic",
          "parent": "New Red Sandstone Supergroup",
          "ref_id": 27
        },
        "map_unit": {
          "map_id": 2032435,
          "unit_name": "Triassic Rocks (Undifferentiated)",
          "distance": 0,
          "int_name": "Triassic"
        },
        "liths": [
          {
            "class": "sedimentary",
            "color": "255, 213, 0, 0.5",
            "fill": 607,
            "group": "sandstones",
            "lith_id": 10,
            "name": "sandstone",
            "type": "siliciclastic",
            "count": 1,
            "attributes": []
          }
        ],
        "interval": {
          "int_id": 72,
          "name": "Olenekian",
          "abbrev": null,
          "t_age": 247.2,
          "b_age": 251.2,
          "int_type": "age",
          "color": "176, 81, 165, 0.5"
        },
        "notes": ""
      },
      "fossils": {},
      "minerals": {},
      "comments": 0,
      "age_est": {
        "int_id": 72,
        "name": "Olenekian",
        "color": "#B051A5",
        "b_age": 251.2,
        "t_age": 247.2
      }
    }
  ],
  "xp": {
    "checkin": 100,
    "photos": 400,
    "rocks": 260,
    "taxa": 0,
    "orientation": 0,
    "minerals": 0,
    "other": 15,
    "bonus": 0,
    "total": 775
  },
  "stats": [
    {
      "abr": "Tr",
      "color": "#812B92",
      "count": 1
    }
  ]
};

const checkinWithoutImage = {
  "checkin_id": 37071,
  "person_id": 37262,
  "first_name": "Benjamin",
  "last_name": "CARRASCO",
  "notes": "Fossiles bedouiliens",
  "rating": 5,
  "lng": 2.8532184134812724,
  "lat": 42.90004190054273,
  "near": "Perpignan, Languedoc-Roussillon, France",
  "created": "April 28, 2025",
  "added": "April 28, 2025",
  "photo": null,
  "likes": "2",
  "comments": 0,
  "liked": false,
  "status": 1,
  "observations": [
    {
      "obs_id": 55495,
      "photo": 68233,
      "lng": null,
      "lat": null,
      "orientation": {},
      "rocks": {},
      "fossils": {},
      "minerals": {},
      "comments": 0
    }
  ],
  "xp": {
    "checkin": 100,
    "photos": 100,
    "rocks": 0,
    "taxa": 0,
    "orientation": 0,
    "minerals": 0,
    "other": 0,
    "bonus": 1000,
    "total": 1200
  },
  "stats": []
};

    
export const WithImage = Template.bind({});
WithImage.args = {
  result: [
    checkinWithImage
  ],
  mapRef: null,
  setInspectPosition: () => {},
};

export const WithoutImage = Template.bind({});
WithoutImage.args = {
  result: [
    checkinWithoutImage
  ],
  mapRef: null,
  setInspectPosition: () => {},
};

export const Multiple = Template.bind({});
Multiple.args = {
  result: [
    checkinWithImage,
    checkinWithoutImage
  ],
  mapRef: null,
  setInspectPosition: () => {},
};