/** Examples for use in multiple stories
 * NOT exported.
 */
import h from "@macrostrat/hyper";
import Box from "ui-box";
import { MenuItem } from "@blueprintjs/core";
import { ItemSelect } from ".";

export interface MapLayer {
  id: number;
  name: string;
}

export interface DataType {
  id: string;
  name: string;
  color: string;
}

export const exampleDataTypes: DataType[] = [
  { id: "1", name: "Type 1", color: "#f00" },
  { id: "2", name: "Type 2", color: "#0f0" },
  { id: "3", name: "Type 3", color: "#00f" },
  { id: "4", name: "Type 4", color: "#ff0" },
  { id: "5", name: "Type 5", color: "#f0f" },
  { id: "6", name: "Type 6", color: "#0ff" },
  { id: "7", name: "Type 7", color: "#000" },
  { id: "8", name: "Type 8", color: "#fff" },
  { id: "9", name: "Type 9", color: "#888" },
  { id: "10", name: "Type 10", color: "#444" },
];

export const exampleMapLayers: MapLayer[] = [
  { id: 1, name: "Layer 1" },
  { id: 2, name: "Layer 2" },
  { id: 3, name: "Layer 3" },
  { id: 4, name: "Layer 4" },
  { id: 5, name: "Layer 5" },
];

export function BaseDataTypeSelect({ state, setState, ...rest }) {
  return h(ItemSelect<DataType>, {
    ...rest,
    items: exampleDataTypes,
    selectedItem: state,
    onSelectItem: setState,
    label: "data type",
    icon: "tag",
    itemComponent: ({ item, selected, icon, ...rest }) => {
      return h(MenuItem, {
        icon: h(Box, {
          is: "span",
          width: "1em",
          height: "1em",
          backgroundColor: item.color,
          borderRadius: "3px",
        }),
        text: item.name,
        active: selected,
        ...rest,
      });
    },
  });
}

export function BaseMapLayerSelect({ state, setState, ...rest }) {
  return h(ItemSelect<MapLayer>, {
    ...rest,
    items: exampleMapLayers,
    selectedItem: state,
    onSelectItem: (layer) => {
      setState(layer);
    },
    label: "layer",
    icon: "layers",
  });
}
