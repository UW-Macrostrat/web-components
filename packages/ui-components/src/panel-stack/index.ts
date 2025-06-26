import React, { useState } from "react";
import h from "@macrostrat/hyper";
import { Card, PanelStack2 } from "@blueprintjs/core";

function PanelStack(props) {
  const [currentStack, setCurrentStack] = useState<Array<any>>([
    props.initialPanel,
  ]);

  const addToPanelStack = React.useCallback(
    (newPanel) => setCurrentStack((stack) => [...stack, newPanel]),
    [],
  );
  const removeFromPanelStack = React.useCallback(
    () => setCurrentStack((stack) => stack.slice(0, -1)),
    [],
  );

  return h(
    Card,
    {
      style: { margin: "0", padding: "0" },
      elevation: props.elevation || 1,
    },
    [
      h(PanelStack2, {
        className: props.className,
        onOpen: addToPanelStack,
        onClose: removeFromPanelStack,
        renderActivePanelOnly: props.renderActivePanelOnly || true,
        showPanelHeader: true,
        stack: currentStack,
      }),
    ],
  );
}

export { PanelStack };
