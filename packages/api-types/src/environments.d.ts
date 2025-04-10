/** example environment:
 {
  environ_id: 1,
  name: "peritidal",
  type: "carbonate",
  class: "marine",
  color: "#B8B8E6",
  t_units: "94",
};
 */

export interface Environment {
  environ_id: number; // Unique identifier for the environment
  name: string; // Name of the environment
  type: string; // Type of environment (e.g., carbonate)
  class: string; // Class of environment (e.g., marine)
  color: string; // Color code for visualization (e.g., hex color)
  t_units?: string; // Total number of units
}
