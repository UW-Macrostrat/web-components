import { useContext } from "react";
import h from "./hyper";
import { ColumnContext } from "./context";

function ColumnImage(props) {
  const { src, ...rest } = props;
  const { pixelHeight } = useContext(ColumnContext);
  return h("div.column-image", { style: rest }, [
    h("img", { src, style: { height: pixelHeight } })
  ]);
}

export { ColumnImage };
