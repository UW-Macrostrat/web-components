import hyper from "@macrostrat/hyper";
import { InfoDrawerHeader, InfoDrawerHeaderProps } from "./header";
import classNames from "classnames";
import styles from "./main.module.sass";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { PanelCard } from "../container";
import { ComponentType } from "react";

const h = hyper.styled(styles);

export function InfoDrawerContainer(props) {
  const className = classNames("infodrawer", props.className);
  return h(PanelCard, { ...props, className });
}

type Component = string | ComponentType<any>;

interface BaseInfoDrawerProps extends InfoDrawerHeaderProps {
  className?: string;
  title?: string;
  headerElement?: JSX.Element;
  children?: React.ReactNode;
  contentContainer?: Component;
}

export function BaseInfoDrawer(props: BaseInfoDrawerProps) {
  const {
    className,
    headerElement = null,
    title,
    onClose,
    children,
    contentContainer = "div.infodrawer-contents",
    ...rest
  } = props;
  const header =
    headerElement ??
    h(InfoDrawerHeader, { onClose, ...rest }, [
      title == null ? null : h("h3", [title]),
    ]);
  return h(InfoDrawerContainer, { className }, [
    header,
    h("div.infodrawer-body", h(ErrorBoundary, h(contentContainer, children))),
  ]);
}

export const DetailsPanel = BaseInfoDrawer;

export function LocationPanel(props) {
  const { children, className, loading = false, ...rest } = props;
  const cls = classNames("location-panel", className, { loading });
  return h(BaseInfoDrawer, { className: cls, ...rest }, children);
}
