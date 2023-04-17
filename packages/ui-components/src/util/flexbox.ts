import hyper from "@macrostrat/hyper";
import styles from "./main.module.scss";
import { forwardRef } from "react";
import _Box from "ui-box";
const h = hyper.styled(styles);

export const Box = _Box;

export const FlexBox = forwardRef((props, ref) => {
  const { grow, shrink, className, style, textAlign, ...rest } = props;
  return h(Box, {
    className,
    flexGrow: grow,
    flexShrink: shrink,
    ...rest,
  });
});

export function FlexRow(props) {
  return h(FlexBox, { display: "flex", flexDirection: "row", ...props });
}

export function FlexCol(props) {
  return h(FlexBox, { display: "flex", flexDirection: "row", ...props });
}

export function FlexSpacer(props) {
  return h(FlexBox, { flex: 1, ...props });
}
