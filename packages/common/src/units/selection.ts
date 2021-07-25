import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction
} from "react";
import { BaseUnit } from "@macrostrat/api-types";
import h from "@macrostrat/hyper";

type UnitSelectDispatch = Dispatch<SetStateAction<BaseUnit | null>>;

const UnitSelectionContext = createContext<BaseUnit | null>(null);
const DispatchContext = createContext<UnitSelectDispatch | null>(null);

export function useUnitSelector(u: BaseUnit | null) {
  const dispatch = useContext(DispatchContext);
  return (overrideUnit?: BaseUnit | null) => {
    if (overrideUnit !== undefined) u = overrideUnit;
    dispatch?.(u);
  };
}

export function useSelectedUnit() {
  return useContext(UnitSelectionContext);
}

export function UnitSelectionProvider<BaseUnit>(props: {
  children: React.ReactNode;
}) {
  const [unit, setUnit] = useState<BaseUnit | null>(null);
  return h(
    DispatchContext.Provider,
    { value: setUnit },
    h(UnitSelectionContext.Provider, { value: unit }, props.children)
  );
}
