/** Experimental line symbol support */
import { useMapRef } from "../context";
import { useMapConditionalStyle } from "../hooks";
import { useEffect } from "react";
import { toggleLineSymbols } from "@macrostrat/map-styles";

export function MacrostratLineSymbolManager({ showLineSymbols = true }) {
  const mapRef = useMapRef();
  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;
    // Update line symbol visibility on map load
    toggleLineSymbols(map, showLineSymbols);
  }, [mapRef.current]);

  useMapConditionalStyle(mapRef, showLineSymbols, toggleLineSymbols);
  return null;
}
