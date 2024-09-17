import { Button } from "@blueprintjs/core";
import { useEffect } from "react";
import hyper from "@macrostrat/hyper";
import loadable from "@loadable/component";
import { create } from "zustand";
import styles from "./page-admin.module.sass";
import classNames from "classnames";

const h = hyper.styled(styles);

const useStore: any = create((set) => {
  return {
    isOpen: false,
    isSystemEnabled: false,
    setIsOpen(isOpen) {
      set({ isOpen });
    },
    toggle() {
      set((state) => ({ isOpen: !state.isOpen }));
    },
    toggleButton() {
      set((state) => {
        let isOpen = state.isSystemEnabled ? false : state.isOpen;
        return { isSystemEnabled: !state.isSystemEnabled, isOpen };
      });
    },
    buttonRef: null,
    setButtonRef(ref) {
      console.log("Setting button ref");
      set({ buttonRef: ref });
    },
  };
});

function DevToolsDialog({ isOpen, setIsOpen, children }) {
  if (!isOpen) return null;

  const Window = loadable(() =>
    import("./_inner").then((mod) => mod.PageAdminInner)
  );

  return h(Window, { isOpen, setIsOpen }, children);
}

export function DevToolsConsole({ className, children }) {
  const [isOpen, setIsOpen] = useIsOpen();
  const buttonRef = useStore((state) => state.buttonRef);
  useDevToolsKeyBinding();

  const isSystemEnabled = useStore((state) => state.isSystemEnabled);

  if (!isSystemEnabled) return null;

  return h("div", { className }, [
    h(DevToolsDialog, { isOpen, setIsOpen }, children),
    h.if(buttonRef == null)(DevToolsButtonSlot, { setRef: false }),
  ]);
}

export function DevToolsButtonSlot({ setRef = true, className }) {
  const onClick = useStore((state) => state.toggle);
  const _setRef = useStore((state) => state.setButtonRef);
  const isShown = useStore((state) => state.isSystemEnabled);
  const ref = (el) => {
    if (setRef) _setRef(el);
  };

  if (!isShown) return null;

  return h(
    "div.devtools-button",
    { className },
    h(Button, {
      onClick,
      ref,
      minimal: true,
      icon: "code",
    })
  );
}

function useDevToolsKeyBinding() {
  // Show the page admin console only if the appropriate query parameter is set
  // OR if the user presses shift+alt+I
  const toggleButton = useStore((s) => s.toggleButton);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "I" && event.shiftKey) {
        toggleButton();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}

function useIsOpen(): [boolean, (isOpen: boolean) => void] {
  return useStore((state) => [state.isOpen, state.setIsOpen]);
}
