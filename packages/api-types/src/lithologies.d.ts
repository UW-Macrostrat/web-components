/**
 * Type for /defs/lithologies API
 *
 * {"lith_id":2,"name":"gravel","type":"siliciclastic","group":"unconsolidated","class":"sedimentary","color":"#FFAB00","fill":601,"t_units":1291},
 */

import { TypeIdentifier } from "./utils";

export interface LithologyCore {
  lith_id: number; // Unique identifier for the lithology
  name: string; // Name of the lithology
  type: string; // Type of lithology (e.g., siliciclastic)
  class: string; // Class of lithology (e.g., sedimentary)
}

export type LithologyIdentifier = TypeIdentifier<LithologyCore, "lith_id">;

export type LithologyAttribute = {
  id: number;
  name: string;
  type: string;
};

export interface Lithology extends LithologyCore {
  group: string | null; // Group classification (e.g., unconsolidated)
  color: string; // Color code for visualization (e.g., hex color)
  fill?: string | number; // Optional fill value for visualization
  prop?: number | null; // Proportion of the lithology, if applicable.
  atts?: LithologyAttribute[]; // Optional lithology attributes
  t_units?: number; // Total number of units
}
