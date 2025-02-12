import hyper from "@macrostrat/hyper";
import styles from "./main.module.scss";
import { forwardRef } from "react";
import _Box, { BoxProps } from "ui-box";
const h = hyper.styled(styles);

export const Box = _Box;

type FlexBoxProps = BoxProps<"div"> & {
  grow?: number;
  shrink?: number;
  textAlign?: string;
};

export const FlexBox = forwardRef((props: FlexBoxProps, ref) => {
  const { grow, shrink, className, style, textAlign, ...rest } = props;
  return h(Box, {
    className,
    flexGrow: grow,
    flexShrink: shrink,
    textAlign,
    style,
    ...rest,
  });
});

export function FlexRow(props) {
  return h(FlexBox, { display: "flex", flexDirection: "row", ...props });
}

export function FlexCol(props) {
  return h(FlexBox, { display: "flex", flexDirection: "column", ...props });
}

export function Spacer(props) {
  return h(FlexBox, { flex: 1, ...props });
}
