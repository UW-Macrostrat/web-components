export type AgeRange = [number, number];

enum MergeMode {
  Inner,
  Outer,
}

export function mergeAgeRanges(
  ranges: AgeRange[],
  mergeMode: MergeMode = MergeMode.Outer
): AgeRange {
  /** Merge a set of age ranges to get the inner or outer bounds */
  let min = Infinity;
  let max = 0;
  // Negative ages are not handled

  if (mergeMode === MergeMode.Inner) {
    min = Math.min(...ranges.map((d) => d[0]));
    max = Math.max(...ranges.map((d) => d[1]));
  } else {
    min = Math.max(...ranges.map((d) => d[0]));
    max = Math.min(...ranges.map((d) => d[1]));
  }

  // Age ranges should start with the oldest (largest) age
  if (min < max) {
    return [max, min];
  }
  return [min, max];
}

export enum AgeRangeRelationship {
  Disjoint,
  Contains,
  Contained,
  Identical,
}

function convertToForwardOrdinal(a: AgeRange): AgeRange {
  /** Age ranges are naturally expressed as [b_age, t_age] where
   * b_age is the older age and t_age is the younger age. This function
   * converts the age range to [min, max] where min is the oldest age,
   * expressed as negative numbers. This assists with intuitive ordering
   * in certain cases.
   */
  if (a[0] < a[1]) {
    // Already in forward ordinal form
    return a;
  }
  // Convert to forward ordinal form
  return [a[1], a[0]];
}

export function compareAgeRanges(
  a: AgeRange,
  b: AgeRange,
  dt: number = 0
): AgeRangeRelationship {
  let a1 = convertToForwardOrdinal(a);
  let b1 = convertToForwardOrdinal(b);

  if (dt > 0) {
    // Shrink age ranges by dt
    a1 = [a1[0] + dt, a1[1] - dt];
    b1 = [b1[0] + dt, b1[1] - dt];
  }

  /** Compare two age ranges */
  if (a1[0] > b1[1] || a1[1] < b1[0]) {
    return AgeRangeRelationship.Disjoint;
  }
  if (a1[0] === b1[0] && a1[1] === b1[1]) {
    return AgeRangeRelationship.Identical;
  }
  if (a1[0] <= b1[0] && a1[1] >= b1[1]) {
    return AgeRangeRelationship.Contains;
  }
  if (a1[0] >= b1[0] && a1[1] <= b1[1]) {
    return AgeRangeRelationship.Contained;
  }
}
