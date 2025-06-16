import styles from "./search-bar.module.sass";
import { Card, InputGroup  } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";

const h = hyper.styled(styles);

export function SearchBar({ onChange, placeholder = "Search..." }) {
  return h(InputGroup, {
    className: "search-bar",
    size: "large",
    fill: true,
    round: false,
    placeholder,
    onChange: (e) => {
      const value = e.target.value;
      onChange(value);
    },
    leftIcon: "search"
  });
}