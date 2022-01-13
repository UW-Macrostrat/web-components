import { useState, useEffect } from "react";
import { getQueryString, setQueryString } from "@macrostrat/ui-components";

function useColumnNav(defaultArgs = { col_id: 495 }) {
  const initArgs = getQueryString() ?? defaultArgs;
  const [columnArgs, setColumnArgs] = useState(initArgs);

  useEffect(() => setQueryString(columnArgs));

  const { col_id, ...projectParams } = columnArgs;

  const setCurrentColumn = obj => {
    let args = obj;
    if ("properties" in obj) {
      args = { col_id: obj.properties.col_id, ...projectParams };
    }
    // Set query string
    setQueryString(args);
    setColumnArgs(args);
  };

  return [columnArgs, setCurrentColumn];
}

export { useColumnNav };
