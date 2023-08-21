import "core-js/stable";
import "regenerator-runtime/runtime";

import { FocusStyleManager } from "@blueprintjs/core";

FocusStyleManager.onlyShowFocusOnTabs();

import { render } from "react-dom";
import h from "@macrostrat/hyper";
// Import styles shared between all apps
import "./deps.scss";

export default function renderApp(
  Component: React.ComponentType,
  target: Element
) {
  render(h(Component), target);
}
