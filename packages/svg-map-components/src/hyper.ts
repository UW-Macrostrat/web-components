import { hyperStyled } from "@macrostrat/hyper";

import styles from "./main.module.scss";
import styleRules from "./main.module.scss?inline";
import { useEffect } from "react";

export function useGlobalStyles() {
  const id = "svg-map-components-global-styles";
  useEffect(() => {
    if (document == null) return;
    let styleEl = document.getElementById(id);
    if (styleEl == null) {
      styleEl = document.createElement("style");
      styleEl.id = id;
      styleEl.innerHTML = styleRules;
      document.head.appendChild(styleEl);
    }
  }, []);
}

const h: ReturnType<typeof hyperStyled> = hyperStyled(styles);

export default h;
