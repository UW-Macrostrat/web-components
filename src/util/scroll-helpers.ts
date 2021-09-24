import { useState, useEffect, useMemo } from "react";
import { pairs } from "d3-array";

interface ScrollMarker {
  id: string;
  offset: number;
}

function useScrollMarkers(
  markers: ScrollMarker[],
  callback?: (marker: ScrollMarker | null) => void
): ScrollMarker | null {
  /** Hook that notifies when we pass a scroll marker */
  const [lastMarker, setLastMarker] = useState<ScrollMarker | null>(null);
  const [offset, setOffset] = useState(null);

  useEffect(() => {
    const handleScroll = (event) =>
      setOffset(document.scrollingElement.scrollTop);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  const markerPairs: [ScrollMarker, ScrollMarker][] = useMemo(() => {
    let sortedMarkers = [...markers];
    sortedMarkers.sort((a, b) => a.offset - b.offset);
    return pairs([
      { id: "start", offset: 0 },
      ...sortedMarkers,
      { id: "end", offset: Number.MAX_SAFE_INTEGER },
    ]);
  }, [markers]);

  useEffect(() => {
    for (const [m1, m2] of markerPairs) {
      if (offset >= m1.offset && offset < m2.offset) {
        let markerToSet = m1.id === "start" ? null : m1;
        if (markerToSet != lastMarker) {
          setLastMarker(markerToSet);
          callback?.(markerToSet);
        }
      }
    }
  }, [markerPairs, offset]);

  return lastMarker;
}

export { useScrollMarkers, ScrollMarker };
