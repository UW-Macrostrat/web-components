// Mechanics to render the app. Everything below here is React components dynamically rendered.
import App from "./app";
import renderApp from "common/renderer";
renderApp(App, document.querySelector("#app"));
