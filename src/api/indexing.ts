import { createContext, useContext } from "react";
import h from "@macrostrat/hyper";

type IndexingCtx = {
  totalCount?: number;
  indexOffset?: number;
};

const IndexingContext = createContext<IndexingCtx | null>(null);

function IndexingProvider(props: { children?: React.ReactNode } & IndexingCtx) {
  const { children, ...value } = props;
  return h(IndexingContext.Provider, { value }, children);
}

const useIndexing = () => useContext(IndexingContext);

export { IndexingProvider, useIndexing };
