import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";

const h = hyper.styled(styles);

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
