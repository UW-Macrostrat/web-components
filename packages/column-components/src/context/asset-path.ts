/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { createContext } from "react";
import h from "@macrostrat/hyper";

interface AssetPathCtx {
  resolveSymbol: (symbol: string) => string | null;
}

const AssetPathContext = createContext<AssetPathCtx>({
  resolveSymbol(): string | null {
    return null;
  },
});

interface AssetPathProviderProps extends AssetPathCtx {
  children: React.ReactNode;
}

function AssetPathProvider(props: AssetPathProviderProps) {
  const { children, resolveSymbol } = props;
  return h(
    // @ts-ignore
    AssetPathContext.Provider,
    {
      value: { resolveSymbol },
    },
    children
  );
}

export { AssetPathContext, AssetPathProvider };
