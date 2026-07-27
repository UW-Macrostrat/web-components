import h from "@macrostrat/hyper";
import PBDBCollections from "./collections";
import { useDeprecationWarning } from "@macrostrat/ui-components";

export function FossilCollections(props) {
  useDeprecationWarning("FossilCollections");

  const { data, expanded = false } = props;

  if (!data || data.length <= 0) {
    return null;
  }
  return h(PBDBCollections, { data });
}
