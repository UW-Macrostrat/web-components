import h from "@macrostrat/hyper";
import { createContext, ReactNode, useContext, useEffect } from "react";
import { useMemo, useState } from "react";

interface DetailPanelLoadingState {
  loading: boolean;
  setLoading(loading: boolean): void;
}

const DetailPanelLoadingContext = createContext<DetailPanelLoadingState | null>(
  null,
);

/** Shares whether the detail panel is still loading its content, so the map
 * can hold its move to a selected location until the panel has its final size. */
export function DetailPanelLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const value = useMemo(() => ({ loading, setLoading }), [loading]);
  return h(DetailPanelLoadingContext.Provider, { value }, children);
}

export function useDetailPanelLoading(): boolean {
  return useContext(DetailPanelLoadingContext)?.loading ?? false;
}

export function useReportDetailPanelLoading(loading: boolean) {
  const setLoading = useContext(DetailPanelLoadingContext)?.setLoading;
  useEffect(() => {
    if (setLoading == null) return;
    setLoading(loading);
    return () => setLoading(false);
  }, [setLoading, loading]);
}
