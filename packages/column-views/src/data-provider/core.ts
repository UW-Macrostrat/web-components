import { atom, type WritableAtom } from "jotai";
import { createIsolation } from "jotai-scope";
import { BaseUnit } from "@macrostrat/api-types";
import { ReactNode, useEffect, useRef } from "react";
import h from "@macrostrat/hyper";

interface StateIsolation {
  Provider: (props: {
    store?: any;
    initialValues?: AtomMap;
    children: ReactNode;
  }) => ReactNode;
  useStore: () => any;
  useAtom: any;
  useAtomValue: any;
  useSetAtom: any;
}

export const scope: StateIsolation = createIsolation();

export type AtomMap = [WritableAtom<any, any, any>, any][];

type ProviderProps = {
  children: ReactNode;
  atoms?: AtomMap;
  shouldUpdateAtoms?: boolean;
};

export function ScopedProvider({
  children,
  atoms,
  shouldUpdateAtoms = true,
}: ProviderProps) {
  // Always use the same store instance in this tree
  let val = null;
  try {
    val = scope.useStore();
    // This store has already been provided
    return children;
  } catch {
    return h(scope.Provider, { store: null, initialValues: atoms }, [
      h.if(shouldUpdateAtoms)(AtomUpdater, { atoms }),
      children,
    ]);
  }
}

function AtomUpdater({
  atoms,
}: {
  atoms: [WritableAtom<any, any, any>, any][];
}) {
  /**
   * A generic updater to sync Jotai atoms with state passed as props.
   * Useful for scoped providers where state needs to be synced outside
   * the current context.
   */
  /** TODO: this is an awkward way to keep atoms updated */
  // The scoped store
  const store = scope.useStore();

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

export const columnUnitsAtom = atom<BaseUnit[]>();

export const columnUnitsMapAtom = atom<Map<number, BaseUnit> | null>((get) => {
  const units = get(columnUnitsAtom);
  if (!units) return null;
  const unitMap = new Map<number, BaseUnit>();
  units.forEach((unit) => {
    unitMap.set(unit.unit_id, unit);
  });
  return unitMap;
});
