import { useContext } from "react";
import h from "./hyper";
import { ColumnContext } from "./context";

interface ColumnImageProps {
  src: string;
  insets?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  clip?: boolean;
}

function ColumnImage(props: ColumnImageProps) {
  const { src, insets = {}, clip = true, ...rest } = props;
  const { pixelHeight } = useContext(ColumnContext);
  let margins: any = {};
  for (let key in insets) {
    margins["margin" + key[0].toUpperCase() + key.slice(1)] = -insets[key];
  }

  const overflow = clip ? "hidden" : "visible";

  const height =
    pixelHeight - (margins.marginTop ?? 0) - (margins.marginBottom ?? 0);
  return h("div.column-image", { style: { overflow, ...rest } }, [
    h("img", { src, style: { height, ...margins } }),
  ]);
}

export { ColumnImage };
