import { Icon, Button } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { useToaster } from "@macrostrat/ui-components";
import { LngLatCoords, Elevation } from "../location-info";
import {
  LocationFocusButton,
  useFocusState,
  isCentered,
} from "@macrostrat/mapbox-react";
import classNames from "classnames";

const h = hyper.styled(styles);

function PositionButton({ position, bounds, showCopyLink = false }) {
  const focusState = useFocusState(position);

  const copyLinkIsVisible = isCentered(focusState) && showCopyLink;

  return h("div.position-controls", [
    h(LocationFocusButton, { location: position, bounds, focusState }, []),
    h.if(copyLinkIsVisible && position != null)(CopyLinkButton, {
      itemName: "position",
    }),
  ]);
}

function CopyLinkButton({ itemName, children, onClick, ...rest }) {
  const toaster = useToaster();

  let message = `Copied link`;
  if (itemName != null) {
    message += ` to ${itemName}`;
  }
  message += "!";

  return h(
    Button,
    {
      className: "copy-link-button",
      rightIcon: h(Icon, { icon: "link", size: 12 }),
      minimal: true,
      small: true,
      onClick() {
        navigator.clipboard.writeText(window.location.href).then(
          () => {
            toaster?.show({
              message,
              intent: "success",
              icon: "clipboard",
              timeout: 1000,
            });
            onClick?.();
          },
          () => {
            toaster?.show({
              message: "Failed to copy link",
              intent: "danger",
              icon: "error",
              timeout: 1000,
            });
          }
        );
      },
      ...rest,
    },
    children ?? "Copy link"
  );
}

export interface InfoDrawerHeaderProps {
  onClose?: () => void;
  position?: mapboxgl.LngLat;
  zoom?: number;
  elevation?: number;
  showCopyPositionButton?: boolean;
  bounds?: mapboxgl.LngLatBounds;
  fixedHeight?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function InfoDrawerHeader(props: InfoDrawerHeaderProps) {
  const {
    onClose,
    position,
    bounds,
    zoom = 7,
    elevation,
    showCopyPositionButton,
    fixedHeight = false,
    children,
    className,
  } = props;

  let leftButton = null;
  if (bounds != null || position != null) {
    leftButton = h(PositionButton, {
      position,
      bounds,
      showCopyLink: showCopyPositionButton,
    });
  }

  return h(
    "header.location-panel-header",
    {
      className: classNames(className, { "fixed-height": fixedHeight }),
    },
    [
      leftButton,
      children,
      h("div.spacer"),
      h.if(position != null)(LngLatCoords, {
        position,
        zoom,
        className: "infodrawer-header-item",
      }),
      h.if(elevation != null)(Elevation, {
        elevation,
        className: "infodrawer-header-item",
      }),
      h.if(onClose != null)(Button, {
        minimal: true,
        icon: "cross",
        onClick: onClose,
      }),
    ]
  );
}
