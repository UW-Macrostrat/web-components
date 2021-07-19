// With Parcel v1, this file needs to be in the root directory.
// https://github.com/parcel-bundler/parcel/issues/2449
import "../../node_modules/core-js/stable";
import "regenerator-runtime/runtime";

import { FocusStyleManager } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import "../../packages/column-components/dist/esm/index.css";

FocusStyleManager.onlyShowFocusOnTabs();
import h from "./hyper";
import { render } from "react-dom";
import { App } from "./src";

const el = document.querySelector("#app");
render(h(App), el);
