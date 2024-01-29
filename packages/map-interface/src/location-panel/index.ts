import { Card } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { InfoDrawerHeader, InfoDrawerHeaderProps } from "./header";
import classNames from "classnames";
import styles from "./main.module.sass";
import { ErrorBoundary } from "@macrostrat/ui-components";

const h = hyper.styled(styles);

export function InfoDrawerContainer(props) {
  const className = classNames("infodrawer", props.className);
  return h(Card, { ...props, className });
}

interface BaseInfoDrawerProps extends InfoDrawerHeaderProps {
  className?: string;
  title?: string;
  headerElement?: JSX.Element;
  children?: React.ReactNode;
}

export function BaseInfoDrawer(props: BaseInfoDrawerProps) {
  const {
    className,
    headerElement = null,
    title,
    onClose,
    children,
    ...rest
  } = props;
  const header =
    headerElement ??
    h(InfoDrawerHeader, { onClose, ...rest }, [
      title == null ? null : h("h3", [title]),
    ]);
  return h(InfoDrawerContainer, { className }, [
    header,
    h(
      "div.infodrawer-body",
      h("div.infodrawer-contents", h(ErrorBoundary, null, children))
    ),
  ]);
}

export function LocationPanel(props) {
  const { children, className, loading = false, ...rest } = props;
  const cls = classNames("location-panel", className, { loading });
  return h(BaseInfoDrawer, { className: cls, ...rest }, children);
}
