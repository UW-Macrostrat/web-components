/** A scoped state that wraps several Jotai atoms together, creating an isolated state
 * context.
 */
import type { WritableAtom } from "jotai";
import { ReactNode, useEffect, useMemo, useRef } from "react";
import h from "@macrostrat/hyper";

import { createIsolation } from "jotai-scope";

export function createScopedStore(): StateIsolation {
  /** A typed wrapper around Jotai-Scope's createIsolation function */
  return enhanceJotaiScope(createIsolation());
}

interface JotaiScope {
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

interface StateIsolation extends JotaiScope {
  Provider: (props: ProviderProps) => ReactNode;
  useAtomValueIfExists: <T>(atom: WritableAtom<T, any, any>) => T | null;
}

export type AtomMap = [WritableAtom<any, any, any>, any][];

type ProviderProps = {
  children: ReactNode;
  atoms?: AtomMap;
  keepUpdated?: boolean;
  inherit?: boolean;
};

function enhanceJotaiScope(scope: JotaiScope): StateIsolation {
  /** Enhance a Jotai scope with more sophisticated Provider */
  return {
    ...scope,
    Provider: (props: ProviderProps): ReactNode =>
      h(ScopedProvider, { ...props, scope }) as ReactNode,
    useAtomValueIfExists: function <T>(
      atom: WritableAtom<T, any, any>,
    ): T | null {
      /** Like useAtomValue, but returns null if no provider is found */
      try {
        return scope.useAtomValue(atom);
      } catch (e) {
        // No provider found
        return null;
      }
    },
  };
}

function ScopedProvider({
  scope,
  children,
  atoms,
  keepUpdated = false,
  inherit = false,
}: ProviderProps & { scope: JotaiScope }) {
  // Always use the same store instance in this tree
  const store = useStore(scope, inherit);
  if (store != null) {
    // This store has already been provided from a parent
    return children;
  }
  return h(scope.Provider, { store: null, initialValues: atoms }, [
    h.if(keepUpdated)(AtomUpdater, { atoms, scope }),
    children,
  ]);
}

function useStore(scope: JotaiScope, inherit: boolean = true) {
  /** A scoped provider for a store */
  if (!inherit) {
    return null;
  }
  try {
    return scope.useStore();
  } catch (e) {
    return null;
  }
}

function AtomUpdater({
  scope,
  atoms,
}: {
  scope: JotaiScope;
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
