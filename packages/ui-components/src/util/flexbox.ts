import hyper from "@macrostrat/hyper";
import styles from "./main.module.scss";
import _Box from "ui-box";
const h = hyper.styled(styles);

export const Box = _Box;

export function FlexBox({
  grow,
  shrink,
  className,
  style,
  textAlign,
  ...props
}) {
  return h(Box, {
    className,
    flexGrow: grow,
    flexShrink: shrink,
    ...props,
  });
}

export function FlexRow(props) {
  return h(FlexBox, { display: "flex", flexDirection: "row", ...props });
}

export function FlexCol(props) {
  return h(FlexBox, { display: "flex", flexDirection: "row", ...props });
}

export function FlexSpacer(props) {
  return h(FlexBox, { flex: 1, ...props });
}
