/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from "~/hyper";
import { Switch, Button } from "@blueprintjs/core";
import { Component } from "react";
import { Panel } from "~/src/ui";

const Control = ({ title, children }) =>
  h("label.bp3-label", [title, h(Switch)]);

const SettingsPanel = function(props) {
  const {
    inEditMode,
    generalized,
    updateState,
    resetDemoData,
    ...rest
  } = props;

  const toggle = key => () => updateState({ $toggle: [key] });

  return h(
    Panel,
    {
      className: "settings-panel",
      title: "Settings",
      ...rest
    },
    [
      h("form", [
        h(Switch, {
          label: "Edit mode",
          checked: inEditMode,
          onChange: toggle("inEditMode")
        }),
        h(Switch, {
          label: "Generalized",
          checked: generalized,
          onChange: toggle("generalized")
        }),
        h(
          Button,
          { onClick: resetDemoData, disabled: resetDemoData == null },
          "Reset demo"
        )
      ])
    ]
  );
};

export { SettingsPanel };
