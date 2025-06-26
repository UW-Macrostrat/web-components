import {
  useContext,
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  PropsWithChildren,
} from "react";
import h from "@macrostrat/hyper";
import { GeologicPattern, GeologicPatternContext } from "./patterns";
import { UUIDProvider, useUUID } from "../frame";

interface PatternDefsCtx {
  trackPattern(id: string): void;
}

const PatternDefsContext = createContext<PatternDefsCtx | null>(null);

interface GeologicPatternProps {
  patternIDs: Set<string | -1>;
  scalePattern?(_: string): number;
  UUID?: string;
}

const GeologicPatternDefs = function (props: GeologicPatternProps) {
  let { patternIDs, scalePattern } = props;
  const UUID = props.UUID ?? useUUID();

  return h(
    "defs",
    Array.from(patternIDs).map(function (id, i) {
      if (id === -1) {
        return null;
      }
      let sz = 100;
      if (scalePattern != null) {
        sz *= scalePattern(id);
      }
      return h(GeologicPattern, {
        key: i,
        prefix: UUID,
        id,
        width: sz,
        height: sz,
      });
    }),
  );
};

type LithologySymbolCtx = any;

type LithProviderProps = PropsWithChildren<LithologySymbolCtx>;

function PatternDefsProvider(props: LithProviderProps) {
  /** A next-generation provider for lithology patterns in the context of an SVG.
   *  We should consider generalizing this further to work without needing the "resolveID" function.
   */
  const { scalePattern, children } = props;
  const [patternIDs, setPatternIDs] = useState<Set<string>>(new Set());

  const trackPattern = useCallback(
    (p: string) => {
      if (patternIDs.has(p)) return;
      let newSet = new Set(patternIDs);
      newSet.add(p);
      setPatternIDs(newSet);
    },
    [patternIDs],
  );

  const value = useMemo(() => {
    return { trackPattern };
  }, [trackPattern]);

  return h(
    UUIDProvider,
    h(
      PatternDefsContext.Provider,
      { value },
      h("g.patterns", [
        h(GeologicPatternDefs, { scalePattern, patternIDs }),
        children,
      ]),
    ),
  );
}

function useGeologicPattern(patternID: string, fallback: string = "#aaa") {
  const ctx1 = useContext(GeologicPatternContext);
  const ctx = useContext(PatternDefsContext);
  const UUID = useUUID();
  useEffect(() => {
    ctx?.trackPattern(patternID);
  }, [patternID, ctx]);
  let v = ctx1?.resolvePattern(patternID);
  if (v == null) return fallback;

  return `url(#${UUID}-${patternID})`;
}

export { PatternDefsProvider, useGeologicPattern };
