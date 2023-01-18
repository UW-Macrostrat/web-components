import { Toaster } from "@blueprintjs/core";

// We might want to refactor this
function createAppToaster() {
  return Toaster.create();
}

export { createAppToaster };
