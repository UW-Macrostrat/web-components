import h, { C, compose } from "@macrostrat/hyper";
import { GeologicPatternProvider } from "@macrostrat/column-components";
import patterns from "url:geologic-patterns/assets/svg/*.svg";

const resolvePattern = id => patterns[id];

export default function PatternProvider({ children }) {
  return h(GeologicPatternProvider, { resolvePattern }, children);
}
