/** GitHub link addon for Storybook
 * Similar to @kemuridama/storybook-addon-github but compatible with Storybook 9
 */

import { memo, useCallback, useEffect } from "react";

import { useGlobals, useStorybookApi } from "storybook/manager-api";
import { IconButton } from "storybook/internal/components";
import { LightningIcon } from "@storybook/icons";
import h from "@macrostrat/hyper";

export const ADDON_ID = "@macrostrat/storybook-addon-github" as const;
export const TOOL_ID = `${ADDON_ID}/tool` as const;
export const PARAM_KEY = "githubLink" as const;

function GithubLinkButtonAddon() {
  const [globals, updateGlobals] = useGlobals();
  const api = useStorybookApi();

  const isActive = [true, "true"].includes(globals[PARAM_KEY]);

  const toggleMyTool = useCallback(() => {
    updateGlobals({
      [PARAM_KEY]: !isActive,
    });
  }, [isActive]);

  useEffect(() => {
    api.setAddonShortcut(ADDON_ID, {
      label: "Toggle Addon [8]",
      defaultShortcut: ["8"],
      actionName: "myaddon",
      showInMenu: false,
      action: toggleMyTool,
    });
  }, [toggleMyTool, api]);

  return h(
    IconButton,
    {
      key: TOOL_ID,
      active: isActive,
      title: "Enable my addon",
      onClick: toggleMyTool,
    },
    h(LightningIcon),
  );
}

export const GithubLink = memo(GithubLinkButtonAddon);
