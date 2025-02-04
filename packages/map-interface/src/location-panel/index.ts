import hyper from "@macrostrat/hyper";
import { InfoDrawerHeader, InfoDrawerHeaderProps } from "./header";
import classNames from "classnames";
import styles from "./main.module.sass";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { PanelCard } from "../container";

const h = hyper.styled(styles);

export function InfoDrawerContainer(props) {
  const className = classNames("infodrawer", props.className);
  return h(PanelCard, { ...props, className });
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

export const DetailsPanel = BaseInfoDrawer;

export function LocationPanel(props) {
  const { children, className, loading = false, ...rest } = props;
  const cls = classNames("location-panel", className, { loading });
  return h(BaseInfoDrawer, { className: cls, ...rest }, children);
}
