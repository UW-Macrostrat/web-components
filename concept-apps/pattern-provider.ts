import h, { C, compose } from "@macrostrat/hyper";
import { GeologicPatternProvider } from "@macrostrat/column-components";
import patterns from "url:../deps/geologic-patterns/assets/png/*.png";

const resolvePattern = id => patterns[id];

export default function PatternProvider({ children }) {
  return h(GeologicPatternProvider, { resolvePattern }, children);
}
