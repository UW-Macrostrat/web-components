import { Navbar, Button, Spinner, Card, Text } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { useMapStatus } from "@macrostrat/mapbox-react";
import { Spacer } from "@macrostrat/ui-components";
import type { ReactNode } from "react";

const h = hyper.styled(styles);

const spinnerElement = h(Spinner, { size: 16 });

export function LoadingButton({
  isLoading = false,
  onClick,
  active = false,
  large = true,
  icon = "menu",
  style,
}) {
  return h(Button, {
    className: "loading-button",
    icon: (isLoading ? spinnerElement : icon) as any,
    large,
    minimal: true,
    onClick,
    active: active && !isLoading,
    style,
  });
}

export function MapLoadingButton(props: any) {
  const isLoading = useMapStatus((s) => s.isLoading);
  return h(LoadingButton, { ...props, isLoading });
}

type AnyChildren = ReactNode;

export interface FloatingNavbarProps {
  className?: string;
  children?: AnyChildren;
  headerElement?: AnyChildren;
  title?: AnyChildren;
  statusElement?: AnyChildren;
  rightElement?: AnyChildren;
  height?: number | string;
  width?: number | string;
  style?: object;
}

export function FloatingNavbar({
  className,
  children,
  headerElement = null,
  title = null,
  statusElement = null,
  rightElement = null,
  height,
  width,
  style = {},
}: FloatingNavbarProps) {
  let _rightElement: ReactNode | null = null;
  if (rightElement != null) {
    _rightElement = h("div.right-element", rightElement);
  }

  let _headerElement: ReactNode | null = headerElement;
  if (title != null && _headerElement == null) {
    if (typeof title === "string") {
      _headerElement = h(Text, { tagName: "h2", ellipsize: true }, title);
    } else {
      _headerElement = title;
    }
  }

  if (_headerElement != null) {
    _headerElement = h([_headerElement, h(Spacer)]);
  }

  return h("div.searchbar-holder", { className, style: { width } }, [
    h("div.navbar-holder", [
      h(
        Navbar,
        {
          className: "searchbar navbar panel",
          style: { height, ...style },
        },
        [_headerElement, children, _rightElement]
      ),
    ]),
    h.if(statusElement != null)(
      Card,
      { className: "status-tongue" },
      statusElement
    ),
  ]);
}
