import { createIsolation } from "jotai-scope";
import { atom } from "jotai";
import h from "@macrostrat/hyper";
import { Store } from "jotai/vanilla/store";
import { ComponentProps } from "react";

const { Provider, useAtom, useStore } = createIsolation();

const countAtom = atom(0);

export default {
  title: "Column views/State Isolation",
};

export function StateIsolationExample() {
  return h("div", [
    h(InheritProvider, { initialValues: [[countAtom, 5]] }, [
      h(Counter, { key: "counter-1" }),
      h(InheritProvider, [
        h("p", [
          "This should inherit the initial value of the outer provider, if available. ",
          h(Counter, { key: "counter-2" }),
        ]),
      ]),
      h("hr"),
    ]),
    h(InheritProvider, { initialValues: [[countAtom, 10]] }, [
      h("p", [
        "This provider is separate because it is not nested. ",
        h(Counter, { key: "counter-3" }),
      ]),
    ]),
  ]);
}

type InheritProps = ComponentProps<typeof Provider>;

function InheritProvider({ children, ...rest }: InheritProps) {
  let store: Store | null;
  try {
    store = useStore();
  } catch {
    store = null;
  }
  return h(Provider, { store, ...rest }, children);
}

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return h("div", [
    h("p", [
      `Count: ${count}`,
      " ",
      h(
        "button",
        {
          onClick: () => setCount((c) => c + 1),
        },
        "Increment",
      ),
      " ",
      h(Reset),
    ]),
  ]);
}

function Reset() {
  const [, setCount] = useAtom(countAtom);
  return h(
    "button",
    {
      onClick: () => setCount(0),
    },
    "Reset Count",
  );
}
