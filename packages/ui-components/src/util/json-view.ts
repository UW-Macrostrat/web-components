import { JSONTree } from "react-json-tree";
import { hyperStyled } from "@macrostrat/hyper";
import classNames from "classnames";
import styles from "./main.module.scss";

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
  const { hideRoot, showRoot, className, ...rest } = props;

  let _hideRoot = hideRoot;
  if (showRoot === false) {
    _hideRoot = true;
  }

  return h(
    "div.json-view-container",
    {
      className: classNames(className, {
        "root-hidden": _hideRoot,
      }),
    },
    h(JSONTree, {
      theme: monokai,
      invertTheme: false,
      hideRoot: _hideRoot,
      ...rest,
    }),
  );
}
