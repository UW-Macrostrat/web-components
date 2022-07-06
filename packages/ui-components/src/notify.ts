import { Toaster } from "@blueprintjs/core";

// We might want to refactor this
const AppToaster = typeof window == "object" ? Toaster.create() : {};

export { AppToaster };
