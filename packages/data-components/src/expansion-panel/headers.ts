import h from "./main.module.sass";

export function PanelSubhead(props) {
  const { title, component = "h3", children, ...rest } = props;
  return h("div.panel-subhead", rest, [
    h(
      component,
      {
        className: "title",
      },
      title,
    ),
    children,
  ]);
}
