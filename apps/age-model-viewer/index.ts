import "core-js/stable";
import "regenerator-runtime/runtime";

import App from "./app";
import renderApp from "common/renderer";

renderApp(App, document.querySelector("#app"));
