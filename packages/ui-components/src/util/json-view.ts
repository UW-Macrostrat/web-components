import JSONTree from "react-json-tree";
import { hyperStyled, classed } from "@macrostrat/hyper";
import { inDarkMode, useDarkMode } from "../dark-mode";
import classNames from "classnames";
import styles from "./main.module.styl";

const h = hyperStyled(styles);

const monokai = {
  scheme: "monokai",
  author: "wimer hazenberg (http://www.monokai.nl)",
  base00: "transparent",
  base01: "#383830",
  base02: "#49483e",
  base03: "#75715e",
  base04: "#a59f85",
  base05: "#f8f8f2",
  base06: "#f5f4f1",
  base07: "#f9f8f5",
  base08: "#f92672",
  base09: "#fd971f",
  base0A: "#f4bf75",
  base0B: "#a6e22e",
  base0C: "#a1efe4",
  base0D: "#66d9ef",
  base0E: "#ae81ff",
  base0F: "#cc6633",
};

export function JSONView(props) {
  const invertTheme = !inDarkMode();
  return h(
    "div.json-view-container",
    {
      className: classNames(props.className, {
        "root-hidden": props.hideRoot,
        "invert-theme": invertTheme,
      }),
    },
    h(JSONTree, {
      theme: monokai,
      invertTheme,
      ...props,
    })
  );
}
