import { Toaster } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import {
  createContext,
  useRef,
  useState,
  useContext,
  RefObject,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import type { IToasterProps, ToasterInstance } from "@blueprintjs/core";

// We might want to refactor this
function createAppToaster() {
  return Toaster.create();
}

type ContextualToasterProps = Omit<IToasterProps, "ref" | "usePortal"> & {};

export type ToasterContextProps = ContextualToasterProps & {
  children?: React.ReactNode;
  toasts?: React.ReactNode;
  containerRef?: RefObject<HTMLElement>;
};

const ToasterCtx = createContext<ToasterInstance>(null);

function ContextualToaster({ containerRef, setToaster, ...rest }) {
  const toaster = h(Toaster, {
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
  const [toaster, setToaster] = useState<ToasterInstance>(null);

  return h(ToasterCtx.Provider, { value: toaster }, [
    h(ContextualToaster, { containerRef, setToaster, ...rest }, toasts),
    children,
  ]);
}

function useToaster(): ToasterInstance | null {
  return useContext(ToasterCtx);
}

export { createAppToaster, ToasterContext, useToaster };
