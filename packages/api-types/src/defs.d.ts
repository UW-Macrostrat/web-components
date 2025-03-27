/** References:
 * /defs/refs
 *
 *  Example: {
 *   ref_id: 1,
 *   pub_year: 1985,
 *   author: "Childs, O.E.",
 *   ref: "Correlation of stratigraphic units of North America; COSUNA. AAPG Bulletin 69:173-180.",
 *   doi: null,
 *   url: null,
 *   t_units: 17045,
 * };
 *
 */

export interface MacrostratRef {
  ref_id: number;
  pub_year: number;
  author: string;
  ref: string;
  doi: string | null;
  url: string | null;
  t_units: number;
}
