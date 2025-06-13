import styles from "./search-bar.module.sass";
import { Card, Icon } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";

const h = hyper.styled(styles);

export function SearchBar({ onChange, placeholder = "Search..." }) {
  return h(Card, { className: "search-bar" }, [
    h(Icon, { icon: "search" }),
    h("input", {
      type: "text",
      placeholder,
      onChange: (e) => onChange(e.target.value),
    }),
  ]);
}