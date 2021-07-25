import { createContext } from "react";
import h from "@macrostrat/hyper";

const MapContext = createContext<any>({});

const MapProvider = (props) => {
  const { projection, children } = props;
  return h(MapContext.Provider, { value: { projection } }, children);
};

export { MapContext, MapProvider };
