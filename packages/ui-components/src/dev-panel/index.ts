import { Button, Collapse, Icon } from "@blueprintjs/core";
import { useEffect, useState } from "react";
import hyper from "@macrostrat/hyper";
import { create } from "zustand";
import styles from "./page-admin.module.sass";
import { PageAdminInner } from "./_inner";
import { ErrorBoundary } from "../error-boundary";

const h = hyper.styled(styles);

const useStore: any = create((set) => {
  return {
    isOpen: false,
    isSystemEnabled: false,
    isInitialized: false,
    tools: [],
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

export const usePageDevTool = (title, component) => {
  // This is kind of a hack. We should eventually integrate the dev tools system with Vike
  useEffect(() => {
    useStore.setState((state) => {
      if (state.tools.some((t) => t.title === title)) return state;
      return { tools: [...state.tools, { title, component }] };
    });
  }, []);
};

function DevToolsDialog({ isOpen, setIsOpen, children }) {
  if (!isOpen) return null;
  return h(PageAdminInner, { isOpen, setIsOpen }, children);
}

type DevTool = {
  title: string;
  component: React.ComponentType;
};

export function DevToolsProvider({ children }) {
  return h("div", {}, children);
}

export function DevToolsConsole({
  className,
  tools,
}: {
  className?: string;
  tools: DevTool[];
}) {
  const [isOpen, setIsOpen] = useIsOpen();
  const buttonRef = useStore((state) => state.buttonRef);
  useDevToolsQueryParameter();
  useDevToolsKeyBinding();

  const isSystemEnabled = useStore((state) => state.isSystemEnabled);
  const contextualTools = useStore((state) => state.tools);

  if (!isSystemEnabled) return null;

  console.log(contextualTools, tools);

  return h("div.dev-tools-container", { className }, [
    h(
      DevToolsDialog,
      { isOpen, setIsOpen },
      h(Accordion, { tools: [...contextualTools, ...tools] })
    ),
    h.if(buttonRef == null)(DevToolsButtonSlot, { setRef: false }),
  ]);
}

function Accordion({ tools }: { tools: DevTool[] }) {
  const [openIndex, setOpenIndex] = useState(0);
  return h(
    "div.accordion",
    {},
    tools.map((tool, i) => {
      return h(CollapseArea, {
        title: tool.title,
        isExpanded: i === openIndex,
        setExpanded: () => {
          if (i === openIndex) {
            setOpenIndex(Math.min(Math.max(i + 1, tools.length - 1), 0));
          } else {
            setOpenIndex(i);
          }
        },
        component: tool.component,
      });
    })
  );
}

function CollapseArea({ title, isExpanded, setExpanded, component }) {
  return h("div.collapse-area", [
    h(
      "div.collapse-header",
      { onClick: setExpanded, className: isExpanded ? "expanded" : null },
      [
        h("h3.collapse-title", title),
        h(Icon, { icon: isExpanded ? "chevron-up" : "chevron-down" }),
      ]
    ),
    h(
      Collapse,
      { isOpen: isExpanded },
      h("div.collapse-content", h(ErrorBoundary, h(component)))
    ),
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

function useDevToolsQueryParameter() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const opt = params.get("dev-tools");
    let res = { isInitialized: true };
    if (opt != null) {
      res = { ...res, isSystemEnabled: true, isOpen: opt === "open" };
    }
    // Setup the initial state
    useStore.setState(res);
  }, []);

  // Set the query parameter
  useStore((state) => {
    // Check if window exists
    if (typeof window === "undefined") return;
    if (!state.isInitialized) return;
    const url = new URL(window.location.href);
    if (state.isSystemEnabled) {
      const opt = state.isOpen ? "open" : "enabled";
      url.searchParams.set("dev-tools", opt);
    } else {
      url.searchParams.delete("dev-tools");
    }
    window.history.replaceState({}, "", url.toString());
  });

  return null;
}

function useIsOpen(): [boolean, (isOpen: boolean) => void] {
  return useStore((state) => [state.isOpen, state.setIsOpen]);
}
