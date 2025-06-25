import { addons, types } from "storybook/manager-api";
//import { GithubLink, ADDON_ID, TOOL_ID } from "./github-link";

import yourTheme from "./theme";

addons.setConfig({
  theme: yourTheme,
});

// // Register the addon
// addons.register(ADDON_ID, () => {
//   // Register the tool
//   addons.add(TOOL_ID, {
//     type: types.TOOL,
//     title: "Github Link Addon",
//     match: ({ tabId, viewMode }) => !tabId && viewMode === "story",
//     render: GithubLink,
//   });
// });
