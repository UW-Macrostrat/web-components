import type { IntervalAgeRangeData } from "../src";

/** Units spanning interval ranges, from `/units?response=long` (named) and
 * made up to cover other cases */
export interface Example {
  name: string;
  note: string;
  unit: IntervalAgeRangeData;
}

export const examples: Example[] = [
  {
    name: "Indianola Gp",
    note: "Two intervals, ages match the interval boundaries",
    unit: {
      b_int_id: 47,
      b_int_name: "Berriasian",
      b_prop: 0,
      t_int_id: 37,
      t_int_name: "Santonian",
      t_prop: 1,
      b_age: 143.1,
      t_age: 83.6,
    },
  },
  {
    name: "Chinle Fm",
    note: "Two intervals, top a quarter of the way into the Rhaetian",
    unit: {
      b_int_id: 67,
      b_int_name: "Carnian",
      b_prop: 0,
      t_int_id: 65,
      t_int_name: "Rhaetian",
      t_prop: 0.25,
      b_age: 237,
      t_age: 204.625,
    },
  },
  {
    name: "Norian–Rhaetian (from ages)",
    note: "No proportions given; they're calculated from the ages",
    unit: {
      b_int_id: 66,
      b_int_name: "Norian",
      t_int_id: 65,
      t_int_name: "Rhaetian",
      b_age: 216.5,
      t_age: 201.4,
    },
  },
  {
    name: "Bartonian–Priabonian",
    note: "Neither age at an interval boundary",
    unit: {
      b_int_id: 26,
      b_int_name: "Bartonian",
      t_int_id: 25,
      t_int_name: "Priabonian",
      b_age: 40,
      t_age: 35,
    },
  },
  {
    name: "Moenkopi Fm",
    note: "One interval, spanning all of it",
    unit: {
      b_int_id: 71,
      b_int_name: "Scythian",
      b_prop: 0,
      t_int_id: 71,
      t_int_name: "Scythian",
      t_prop: 1,
      b_age: 251.902,
      t_age: 246.7,
    },
  },
  {
    name: "Lacon Fm",
    note: "One interval, part of it (ages in ka)",
    unit: {
      b_int_id: 4,
      b_int_name: "Pleistocene",
      b_prop: 0.64286,
      t_int_id: 4,
      t_int_name: "Pleistocene",
      t_prop: 0.71428,
      b_age: 0.9289,
      t_age: 0.7455,
    },
  },
  {
    name: "Carnian–Norian (no ages)",
    note: "Interval names only; the span records no ages or proportions",
    unit: {
      b_int_id: 67,
      b_int_name: "Carnian",
      t_int_id: 66,
      t_int_name: "Norian",
    },
  },
];

export function examplesByName(): Record<string, Example> {
  return Object.fromEntries(examples.map((ex) => [ex.name, ex]));
}

/** Interval definitions, from `/defs/intervals` */
export const intervals = (
  [
    [4, "Pleistocene", 2.58, 0.0117, "#FFF2AE"],
    [25, "Priabonian", 37.71, 33.9, "#FDCDA1"],
    [26, "Bartonian", 41.03, 37.71, "#FDC091"],
    [37, "Santonian", 85.7, 83.6, "#D9EF74"],
    [47, "Berriasian", 143.1, 137.05, "#8CCD60"],
    [65, "Rhaetian", 205.7, 201.4, "#E3B9DB"],
    [66, "Norian", 227.3, 205.7, "#D6AAD3"],
    [67, "Carnian", 237, 227.3, "#C99BCB"],
    [71, "Scythian", 251.902, 246.7, "#983999"],
  ] as [number, string, number, number, string][]
).map(([int_id, name, b_age, t_age, color]) => ({
  int_id,
  name,
  b_age,
  t_age,
  color,
}));
