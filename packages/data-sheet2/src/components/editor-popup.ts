import hyper from "@macrostrat/hyper";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { Popover2 } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import styles from "./main.module.sass";

const h = hyper.styled(styles);

export function EditorPopup(props) {
  const { children, content, targetClassName } = props;

  return h(
    Popover2,
    {
      content: h(
        "div.interaction-barrier",
        {
          onMouseDown(evt) {
            evt.nativeEvent.stopImmediatePropagation();
          },
          onKeyDown(evt) {
            console.log(evt);
          },
        },
        h(ErrorBoundary, null, content)
      ),
      enforceFocus: false,
      autoFocus: false,
      minimal: true,
      modifiers: {
        offset: { enabled: true, options: { offset: [0, 8] } },
      },
      interactionKind: "hover-target",
      isOpen: true,
      onClose(evt) {
        props.onKeyDown(evt);
      },
      // Portal must be used to avoid issues with the editor being clipped to the bounds of the cell
      usePortal: true,
    },
    h(
      "span.editor-popup-target",
      { tabIndex: 0, className: targetClassName },
      children
    )
  );
}
