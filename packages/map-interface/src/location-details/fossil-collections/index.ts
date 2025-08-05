import h from "@macrostrat/hyper";
import PBDBCollections from "./collections";

export function FossilCollections(props) {
  const { data, expanded = false } = props;

  if (!data || data.length <= 0) {
    return null;
  }
  return h(PBDBCollections, { data });
}
