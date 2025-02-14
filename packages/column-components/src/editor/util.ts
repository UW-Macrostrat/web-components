import { hyperStyled } from "@macrostrat/hyper";
import styles from "./main.module.scss";
import { format } from "d3-format";
import Select from "react-select";
import { ColumnDivision } from "../context";
const h = hyperStyled(styles);

const LabeledControl = function (props) {
  const { title, children, ...rest } = props;
  delete rest.is;
  return h("div.labeled-control", [
    h("label.bp3-label", null, [
      h.if(title != null)("span.label-text", null, title),
    ]),
    props.is != null ? h(props.is, rest) : null,
  ]);
};

const menuStyles = (provided) => ({
  ...provided,
  zIndex: 999,
});

const RaisedSelect = (props) =>
  h(Select, { styles: { menu: menuStyles }, ...props });

interface IntervalEditorTitleProps {
  showID: boolean;
  title: string;
  interval: ColumnDivision;
  heightFormat: string;
}

const IntervalEditorTitle = function (props: IntervalEditorTitleProps) {
  let { showID, title, interval, heightFormat } = props;
  const { id, top, bottom } = interval;
  let fmt = (v) => v;
  if (heightFormat != null) {
    fmt = format(heightFormat);
  }
  if (showID == null) {
    showID = true;
  }
  return h("div.editor-dialog-title.editor-title", [
    h("h3.title-center", title),
    h("h4.height-range", `${fmt(bottom)} – ${fmt(top)} m`),
    h("h4.id", null, ["ID: ", h.if(id != null && showID)("code", id)]),
  ]);
};

export { LabeledControl, IntervalEditorTitle, RaisedSelect };
