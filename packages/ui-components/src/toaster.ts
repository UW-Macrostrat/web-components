import { OverlayToaster } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import { createContext, useState, useContext, RefObject } from "react";
import { createPortal } from "react-dom";
import type { OverlayToasterProps } from "@blueprintjs/core";

// We might want to refactor this
function createAppToaster() {
  return OverlayToaster.create();
}

type ContextualToasterProps = Omit<
  OverlayToasterProps,
  "ref" | "usePortal"
> & {};

export type ToasterContextProps = ContextualToasterProps & {
  children?: React.ReactNode;
  toasts?: React.ReactNode;
  containerRef?: RefObject<HTMLElement>;
};

const ToasterCtx = createContext<any>(null);

function ContextualToaster({ containerRef, setToaster, ...rest }) {
  const toaster = h(OverlayToaster, {
    usePortal: false,
    ref: (t) => setToaster(t),
    ...rest,
  });
  if (containerRef?.current == null) {
    return toaster;
  }
  return createPortal(toaster, containerRef.current);
}

function ToasterContext(props: ToasterContextProps) {
  const { children, toasts, containerRef, ...rest } = props;
  const [toaster, setToaster] = useState<any>(null);

  return h(ToasterCtx.Provider, { value: toaster }, [
    h(ContextualToaster, { containerRef, setToaster, ...rest }, toasts),
    children,
  ]);
}

function useToaster(): any | null {
  return useContext(ToasterCtx);
}

export { createAppToaster, ToasterContext, useToaster };
