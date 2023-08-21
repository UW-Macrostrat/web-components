import { Card } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { InfoDrawerHeader } from "./header";
import classNames from "classnames";
import styles from "./main.module.sass";
import { ErrorBoundary } from "@macrostrat/ui-components";

const h = hyper.styled(styles);

export function InfoDrawerContainer(props) {
  const className = classNames("infodrawer", props.className);
  return h(Card, { ...props, className });
}

export function LocationPanel(props) {
  const { children, className, loading = false, ...rest } = props;
  const cls = classNames("location-panel", className, { loading });
  return h(InfoDrawerContainer, { className: cls }, [
    h(InfoDrawerHeader, rest),
    h("div.infodrawer-body", h("div.infodrawer-contents", h(ErrorBoundary, null, children))),
  ]);
}
