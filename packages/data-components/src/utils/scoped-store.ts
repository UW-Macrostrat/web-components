/** A scoped state that wraps several Jotai atoms together, creating an isolated state
 * context.
 */
import type { Atom, WritableAtom } from "jotai";
import { ReactNode, useEffect, useRef } from "react";
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

export interface StateIsolation extends JotaiScope {
  Provider: (props: ProviderProps) => ReactNode;
  useAtomValueIfExists: <T>(atom: WritableAtom<T, any, any>) => T | null;
  use: JotaiScope["useAtom"];
  useValue: JotaiScope["useAtomValue"];
  useSet: JotaiScope["useSetAtom"];
  useSync<T>(atom: Atom<T>, value: T): T | undefined;
}

export type AtomMap = [WritableAtom<any, any, any>, any][];

type ProviderProps = {
  children: ReactNode;
  atoms?: AtomMap;
  keepUpdated?: boolean;
  inherit?: boolean;
};

function enhanceJotaiScope(scope: JotaiScope): StateIsolation {
  /** Enhance a Jotai scope with more sophisticated Provider and functions */
  return {
    ...scope,
    use: scope.useAtom,
    useValue: scope.useAtomValue,
    useSet: scope.useSetAtom,
    useSync: <T>(atom: WritableAtom<T, any, any>, value: T): T =>
      useSyncAtom(scope, atom, value),
    Provider: (props: ProviderProps): ReactNode => {
      return h(ScopedProvider, { ...props, scope }) as ReactNode;
    },
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
  inherit = true,
}: ProviderProps & { scope: JotaiScope }) {
  // Always use the same store instance in this tree. We can set inherit = false
  // to allow multiple stores to be nested.
  const store = useStore(scope, inherit);

  if (store != null) {
    /* NOTE: we no longer set initial values on mount because it causes weird situations when the store
     inherits a parent store */
    return children;
  }

  const updater =
    keepUpdated && atoms != null ? h(AtomUpdater, { atoms, scope }) : null;

  return h(scope.Provider, { store, initialValues: atoms }, [
    updater,
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

function AtomUpdater({ scope, atoms }: { scope: JotaiScope; atoms: AtomMap }) {
  /**
   * A generic updater to sync Jotai atoms with state passed as props.
   * Useful for scoped providers where state needs to be synced outside
   * the current context.
   */
  // Warn on atoms changing length
  const prevLengthRef = useRef(atoms.length);
  useEffect(() => {
    if (prevLengthRef.current !== atoms.length) {
      console.error("Error: number of atoms in ScopedAtomUpdater has changed.");
      prevLengthRef.current = atoms.length;
    }
  }, [atoms.length]);

  for (const [atom, value] of atoms) {
    useSyncAtom(scope, atom, value);
  }
  return null;
}

function useSyncAtom<T>(
  scope: JotaiScope,
  atom: WritableAtom<T, any, any>,
  value: T,
): T {
  /** A hook to sync a Jotai atom with state passed as props.
   * Useful for scoped providers where state needs to be synced outside
   * the current context.
   */
  const store = scope.useStore();
  const valueRef = useRef<T>(value);
  useEffect(() => {
    store.set(atom, value);
    valueRef.current = value;
  }, [store, atom, value]);
  return valueRef.current;
}
