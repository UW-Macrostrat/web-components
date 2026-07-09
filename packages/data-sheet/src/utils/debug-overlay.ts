import { useEffect, useRef } from "react";

export function CellRendererDebugOverlay({ cellRendererDependencies, names }) {
  /** Debug overlay for cell renderer dependencies */
  const lastRenderDependencies = useRef<any[]>(cellRendererDependencies);
  useEffect(() => {
    let changeDepNames = [];
    for (const [i, dep] of cellRendererDependencies.entries()) {
      if (dep !== lastRenderDependencies.current[i]) {
        changeDepNames.push(names[i]);
      }
    }
    if (changeDepNames.length > 0) {
      console.log(
        "Cell renderer dependencies changed:",
        changeDepNames.join(", "),
      );
    }
    lastRenderDependencies.current = cellRendererDependencies;
  }, cellRendererDependencies);
  return null;
}
