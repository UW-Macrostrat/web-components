import { Toaster } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import {
  createContext,
  useRef,
  useState,
  useContext,
  RefObject,
  useMemo,
} from "react";
import type { IToasterProps } from "@blueprintjs/core";

// We might want to refactor this
function createAppToaster() {
  return Toaster.create();
}

type ContextualToasterProps = Omit<IToasterProps, "ref" | "usePortal"> & {};

export type ToasterContextProps = ContextualToasterProps & {
  children?: React.ReactNode;
  toasts?: React.ReactNode;
  createToaster?: boolean;
};

interface IToasterCtx {
  toaster: Toaster;
  setToaster: (t: Toaster) => void;
}

const ToasterCtx = createContext<IToasterCtx>(null);

function ContextualToaster(props: ContextualToasterProps) {
  const ctx = useContext(ToasterCtx);
  if (ctx == null) {
    throw new Error(
      "ContextualToaster must be rendered within a ToasterContext"
    );
  }
  return h(Toaster, {
    ref: (t: Toaster) => ctx.setToaster(t),
    usePortal: false,
    ...props,
  });
}

function ToasterContext(props: ToasterContextProps) {
  const [toaster, setToaster] = useState<Toaster>(null);
  const { children, toasts, createToaster = true, ...rest } = props;

  const value = useMemo(() => {
    console.log(toaster);
    return {
      toaster,
      setToaster: (t: Toaster) => setToaster(t),
    };
  }, [toaster]);

  return h(ToasterCtx.Provider, { value }, [
    h.if(createToaster)(ToasterContext.Toaster, { ...rest }, toasts),
    children,
  ]);
}

ToasterContext.Toaster = ContextualToaster;

function useToaster(): Toaster | null {
  return useContext(ToasterCtx)?.toaster;
}

export { createAppToaster, ToasterContext, useToaster };
