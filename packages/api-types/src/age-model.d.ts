/** Age-model boundaries — the calibration surfaces of a column's age model.
 *
 * Served by `/age_model?col_id=` (or `section_id=`) in the v2 API, which reads
 * `macrostrat.unit_boundaries` joined to `intervals`. Example row:
 *
 * ```json
 * {
 *   "boundary_id": 8049,
 *   "col_id": 432,
 *   "section_id": 3104,
 *   "interval_id": 268,
 *   "interval_name": "Calymmian",
 *   "age_bottom": 1600,
 *   "age_top": 1400,
 *   "rel_position": 0.85,
 *   "model_age": 1430,
 *   "boundary_status": "absolute",
 *   "boundary_type": "",
 *   "boundary_position": null,
 *   "unit_below": 11541,
 *   "unit_above": 0,
 *   "ref_id": 217
 * }
 * ```
 */

/** `macrostrat.boundary_status`: how a boundary's age is constrained.
 *
 * The status decides which field is authoritative when the age model is
 * rebuilt: for `absolute` the age wins and the interval proportion is derived
 * from it; for every other value the interval plus proportion win and the age
 * is recomputed from the timescale. */
export type BoundaryStatus =
  "" | "modeled" | "relative" | "absolute" | "spike" | "imposed";

/** `macrostrat.boundary_type`: the geological nature of the contact. */
export type BoundaryType =
  | ""
  | "unconformity"
  | "conformity"
  | "fault"
  | "disconformity"
  | "non-conformity"
  | "angular unconformity";

export interface AgeModelBoundary {
  boundary_id: number;
  col_id: number;
  section_id: number;
  /** The calibration interval (`unit_boundaries.t1`) */
  interval_id: number;
  interval_name: string;
  /** Age range of the calibration interval */
  age_bottom: number;
  age_top: number;
  /** Position within the calibration interval: 0 at its base, 1 at its top
   * (`unit_boundaries.t1_prop`) */
  rel_position: number;
  /** The modeled age of the boundary (`unit_boundaries.t1_age`) */
  model_age: number;
  boundary_status: BoundaryStatus;
  boundary_type: BoundaryType;
  /** Measured position along the column (height or depth), when known */
  boundary_position: number | null;
  /** Units below and above the boundary. Legacy rows use `0` rather than
   * `null` to mean "no unit". */
  unit_below: number | null;
  unit_above: number | null;
  ref_id: number;
}
