/** GitHub link addon for Storybook
 * Similar to @kemuridama/storybook-addon-github but compatible with Storybook 9
 */

import { useStorybookApi } from "storybook/manager-api";
import { IconButton } from "storybook/internal/components";
import { GithubIcon } from "@storybook/icons";
import h from "@macrostrat/hyper";

export const ADDON_ID = "@macrostrat/storybook-addon-github" as const;
export const TOOL_ID = `${ADDON_ID}/tool` as const;
export const PARAM_KEY = "githubLink" as const;

export function GithubLink({ active }: { active?: boolean }) {
  const api = useStorybookApi();
  const currentStoryData = api.getCurrentStoryData();

  if (!currentStoryData) {
    return null;
  }

  const url = [
    "https://github.com",
    "UW-Macrostrat/web-components",
    "blob",
    "main",
    currentStoryData.importPath.replace(/\.\//, ""),
  ].join("/");

  return h(
    IconButton,
    { active },
    h(
      "a",
      { href: url, title: "GitHub", target: "_blank", rel: "noreferrer" },
      [h(GithubIcon), " View on GitHub"],
    ),
  );
}
