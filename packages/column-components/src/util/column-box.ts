/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from "react-hyperscript";
import { useContext } from "react";
import { ColumnContext } from "../context";
import classNames from "classnames";
import Box from "ui-box";

// This could be merged with ColumnSVG
const ColumnBox = function(props) {
  const { offsetTop, absolutePosition, className, ...rest } = props;
  const { pixelsPerMeter, zoom } = useContext(ColumnContext);

  const marginTop = offsetTop * pixelsPerMeter * zoom;
  let pos = { marginTop };
  if (absolutePosition) {
    pos = {
      position: "absolute",
      top: marginTop
    };
  }

  return h(Box, {
    className: classNames("column-box", className),
    ...pos,
    ...rest
  });
};

export { ColumnBox };
