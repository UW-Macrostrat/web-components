const defaultRenderers = {
  string: (d) => d,
  number: (d) => d?.toFixed(2),
  boolean: (d) => (d ? "T" : "F"),
  object: (d) => JSON.stringify(d),
  integer: (d) => d?.toFixed(0),
  array: (d) => d?.join(", "),
};

interface ColumnSpecGenerateOptions {
  calculateWidths?: boolean;
  defaultWidth?: number;
  getWidthForValue?: (value: any) => number;
}

const defaultWidthForValue = (val) => String(val).length * 8;

export function generateDefaultColumnSpec<T>(
  data: Array<T>,
  options: ColumnSpecGenerateOptions = {}
): ColumnSpec[] {
  /** Build a default column spec from a dataset based on the first n rows */
  if (data == null) return [];
  // Get the keys

  const {
    defaultWidth = 150,
    calculateWidths = true,
    getWidthForValue = defaultWidthForValue,
  } = options;

  const keys = new Set<string>();
  const types = new Map();

  const columnWidths = new Map<string, number>();

  for (const row of data) {
    if (row == null) continue;
    for (const key of Object.keys(row)) {
      const val = row[key];
      keys.add(key);

      if (val == null) continue;

      if (calculateWidths) {
        let width = getWidthForValue(val);
        if (width != null && width >= 0) {
          columnWidths.set(key, Math.max(width, columnWidths.get(key) ?? 0));
        }
      }

      let type: string = typeof val;
      // Special 'type' for integers
      if (Number.isInteger(val)) {
        type = "integer";
      }

      // Special 'type' for arrays of simple values
      if (
        Array.isArray(val) &&
        val.every((d) => typeof d === "string" || typeof d === "number")
      ) {
        type = "array";
      }

      if (types.has(key)) {
        if (types.get(key) !== type) {
          if (type === "number" && types.get(key) === "integer") {
            types.set(key, "number");
          }
          if (type === "object" && types.get(key) === "array") {
            types.set(key, "object");
          }

          types.set(key, "string");
        }
      } else {
        types.set(key, type);
      }
    }
  }

  // Build a column spec
  const spec = [];
  for (const key of keys) {
    let width = null;
    if (calculateWidths) {
      // If we are calculating widths, use the value lengths
      width = Math.min(
        Math.max(defaultWidth / 2, columnWidths.get(key) ?? defaultWidth),
        defaultWidth * 1.5
      );
    }

    spec.push({
      name: key,
      key,
      valueRenderer: defaultRenderers[types.get(key)],
      width,
    });
  }
  return spec;
}

export function generateColumnSpec<T>(
  data: T[],
  options: ColumnSpecOptions
): ColumnSpec[] {
  /** Generate a column spec from a dataset */
  const { overrides = {}, nRows = 10, omitColumns, includeColumns } = options;

  if (data == null) return [];

  const _nRows = Math.min(nRows, data.length);

  let columnSpec = generateDefaultColumnSpec(data.slice(0, _nRows));
  let filteredSpec = columnSpec.filter((col) => {
    if (omitColumns != null && omitColumns.includes(col.key)) {
      return false;
    }
    if (includeColumns != null && !includeColumns.includes(col.key)) {
      return false;
    }
    return true;
  });

  // Apply overrides
  return filteredSpec.map((col) => {
    let ovr = overrides[col.key];
    if (ovr == null) return col;
    if (typeof ovr === "string") {
      return { ...col, name: ovr };
    }
    return { ...col, ...ovr };
  });
}
