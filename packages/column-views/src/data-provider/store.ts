import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import h from "@macrostrat/hyper";
import {
  CompositeColumnScale,
  createCompositeScale,
} from "../prepare-units/composite-scale";
import { ColumnAxisType } from "@macrostrat/column-components";
import type { ExtUnit, PackageLayoutData } from "../prepare-units";
// An isolated jotai store for Macrostrat column usage
// TODO: there might be a better way to do this using the MacrostratDataProvider or similar
import { createIsolation } from "jotai-scope";
import { atom, PrimitiveAtom, type WritableAtom } from "jotai";
import { UnitSelectionActions, UnitSelectionProvider } from "./unit-selection";

const { Provider, useSetAtom, useAtomValue, useStore } = createIsolation();

type ProviderProps = {
  children: ReactNode;
  initialValues?: Iterable<[WritableAtom<any, any, any>, any]>;
};

const columnUnitsAtom = atom<ExtUnit[]>();

const columnUnitsMapAtom = atom<Map<number, ExtUnit> | null>((get) => {
  const units = get(columnUnitsAtom);
  if (!units) return null;
  const unitMap = new Map<number, ExtUnit>();
  units.forEach((unit) => {
    unitMap.set(unit.unit_id, unit);
  });
  return unitMap;
});

function ScopedProvider({ children, ...rest }: ProviderProps) {
  // Always use the same store instance in this tree
  let val = null;
  try {
    val = useStore();
  } catch {
    // No store found, create a new one
    val = null;
  }
  return h(Provider, { store: val, ...rest }, children);
}

interface ColumnStateProviderProps extends UnitSelectionActions {
  children: ReactNode;
  units: ExtUnit[];
  allowUnitSelection?: boolean;
}

export function MacrostratColumnStateProvider({
  children,
  units,
  allowUnitSelection = false,
  onUnitSelected,
  selectedUnit,
  columnRef,
}: ColumnStateProviderProps) {
  /** Top-level provider for Macrostrat column data.
   * It is either provided by the Column component itself, or
   * can be hoisted higher in the tree to provide a common data context
   */

  const atomMap: [[PrimitiveAtom<ExtUnit[]>, ExtUnit[]]] = [
    [columnUnitsAtom, units],
  ];

  let main: ReactNode = h(
    ScopedProvider,
    {
      initialValues: atomMap,
    },
    [h(AtomUpdater, { atoms: atomMap }), children],
  );

  /* By default, unit selection is disabled. However, if any related props are passed,
 we enable it.
 */
  let _allowUnitSelection = allowUnitSelection ?? false;
  if (selectedUnit != null || onUnitSelected != null) {
    _allowUnitSelection = true;
  }

  if (_allowUnitSelection) {
    // Wrap in unit selection provider (temporary/legacy)
    main = h(
      UnitSelectionProvider,
      {
        columnRef,
        onUnitSelected,
        selectedUnit,
        units,
      },
      main,
    );
  }

  return main;
}

export interface MacrostratColumnDataContext {
  units: ExtUnit[];
  sections: PackageLayoutData[];
  totalHeight?: number;
  axisType?: ColumnAxisType;
  allowUnitSelection?: boolean;
}

interface ColumnDataProviderProps
  extends MacrostratColumnDataContext,
    ColumnStateProviderProps {
  children: ReactNode;
}

const MacrostratColumnDataContext =
  createContext<MacrostratColumnDataContext>(null);

export function MacrostratColumnDataProvider({
  children,
  units,
  sections,
  totalHeight,
  axisType,
  allowUnitSelection,
  onUnitSelected,
  selectedUnit,
  columnRef,
}: ColumnDataProviderProps) {
  /** Internal provider for Macrostrat column data.
   * As a general rule, we want to provide data and column-axis
   * height calculations through the context, since these need to
   * be accessed by any component that lays out information on the
   * column.
   *
   * Cross-axis layout and view configuration (e.g., showing and hiding
   * of different components or labels) should be handled through passing
   * props to the components themselves.
   * */

  const value = useMemo(() => {
    // For now, change ordinal axis types to age axis types
    return {
      units,
      sections,
      totalHeight,
      axisType,
    };
  }, [units, sections, totalHeight, axisType]);

  return h(
    MacrostratColumnStateProvider,
    {
      units,
      allowUnitSelection,
      onUnitSelected,
      selectedUnit,
      columnRef,
    },
    h(MacrostratColumnDataContext.Provider, { value }, children),
  );
}

export function useMacrostratColumnData() {
  const ctx = useContext(MacrostratColumnDataContext);
  if (!ctx) {
    throw new Error(
      "useMacrostratColumnData must be used within a MacrostratColumnDataProvider",
    );
  }
  return ctx;
}

export function useMacrostratUnits() {
  return useAtomValue(columnUnitsAtom);
}

export function useColumnUnitsMap(): Map<number, ExtUnit> | null {
  try {
    return useAtomValue(columnUnitsMapAtom);
  } catch {
    return null;
  }
}

export function useCompositeScale(): CompositeColumnScale {
  const ctx = useMacrostratColumnData();
  return useMemo(
    () => createCompositeScale(ctx.sections, true),
    [ctx.sections],
  );
}

function AtomUpdater({
  atoms,
}: {
  atoms: [WritableAtom<any, any, any>, any][];
}) {
  /**
   * A generic updater to sync Jotai atoms with state passed as props.
   * Useful for scoped providers where state needs to be synced outside
   * of the current context.
   */
  /** TODO: this is an awkward way to keep atoms updated */
  // The scoped store
  const store = useStore();

  // Warn on atoms changing length
  const prevLengthRef = useRef(atoms.length);
  useEffect(() => {
    if (prevLengthRef.current !== atoms.length) {
      console.error("Error: number of atoms in ScopedAtomUpdater has changed.");
      prevLengthRef.current = atoms.length;
    }
  }, [atoms.length]);

  for (const [atom, value] of atoms) {
    useEffect(() => {
      store.set(atom, value);
    }, [store, value]);
  }
  return null;
}
