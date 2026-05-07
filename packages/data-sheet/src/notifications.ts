import { OverlayToaster } from "@blueprintjs/core";
import { atom, useAtom } from "jotai";
import { ctx } from "./provider";
import { useEffect } from "react";

/** Toaster access
 * Atom that stores a reference to a global or contextual toaster used by the
 * data sheet.
 * */
export const toasterAtom = atom(null);

export function useToaster(toaster?: OverlayToaster): OverlayToaster {
  const [toasterRef, setToasterRef] = ctx.use(toasterAtom);
  useEffect(() => {
    if (toaster != null) {
      setToasterRef(toaster);
    } else {
      OverlayToaster.create().then((t) => setToasterRef(t));
    }
  }, [toaster]);
  return toasterRef;
}
