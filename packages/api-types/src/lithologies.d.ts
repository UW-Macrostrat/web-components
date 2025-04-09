/**
 * Type for /defs/lithologies API
 *
 * {"lith_id":2,"name":"gravel","type":"siliciclastic","group":"unconsolidated","class":"sedimentary","color":"#FFAB00","fill":601,"t_units":1291},
 */

export interface LithologyCore {
  lith_id: number; // Unique identifier for the lithology
  name: string; // Name of the lithology
  type: string; // Type of lithology (e.g., siliciclastic)
  class: string; // Class of lithology (e.g., sedimentary)
}

export interface Lithology extends LithologyCore {
  group: string | null; // Group classification (e.g., unconsolidated)
  color: string; // Color code for visualization (e.g., hex color)
  fill?: string | number; // Optional fill value for visualization
}
