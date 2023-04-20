import { useCallback, useRef, useEffect } from "react";
import { Navbar, Button, InputGroup, Spinner, Card } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { useMapStatus } from "@macrostrat/mapbox-react";

const h = hyper.styled(styles);

const spinnerElement = h(Spinner, { size: 16 });

export function LoadingButton({
  isLoading = false,
  onClick,
  active = false,
  icon = "menu",
}) {
  return h(Button, {
    icon: isLoading ? spinnerElement : icon,
    large: true,
    minimal: true,
    onClick,
    active: active && !isLoading,
  });
}

export function MapLoadingButton(props) {
  const { isLoading } = useMapStatus();
  return h(LoadingButton, { ...props, isLoading });
}

type AnyChildren = React.ReactNode | React.ReactFragment;

export function FloatingNavbar({
  className,
  children,
  statusElement = null,
}: {
  className?: string;
  children?: AnyChildren;
  statusElement?: AnyChildren;
}) {
  return h("div.searchbar-holder", { className }, [
    h("div.navbar-holder", [
      h(Navbar, { className: "searchbar panel" }, children),
    ]),
    h.if(statusElement != null)(
      Card,
      { className: "status-tongue" },
      statusElement
    ),
  ]);
}
