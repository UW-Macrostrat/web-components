import h from "@macrostrat/hyper";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { SketchPicker } from "react-color";
import { Popover2 } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import chroma from "chroma-js";
import "./styles.module.scss";

export function BasePopupEditor(props) {
  const { children, valueRenderer, value, ...rest } = props;

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
        h(ErrorBoundary, null, children)
      ),
      enforceFocus: false,
      autoFocus: false,
      minimal: true,
      modifiers: {
        //offset: { enabled: true, options: { offset: [0, 8] } },
      },
      interactionKind: "hover-target",
      isOpen: true,
      onClose(evt) {
        props.onKeyDown(evt);
      },
      usePortal: false,
    },
    children
  );
}

export function ColorPicker({ value, onChange }) {
  let color = "#aaaaaa";
  try {
    color = chroma(value).hex();
  } catch {}
  return h(SketchPicker, {
    disableAlpha: true,
    color,
    onChange(color, evt) {
      let c = "";
      try {
        c = chroma(color.hex).name();
      } finally {
        onChange(c);
        evt.stopPropagation();
      }
    },
  });
}

export function ColorEditor(props) {
  const { value, onChange, ...rest } = props;
  return h(BasePopupEditor, rest, h(ColorPicker, { value, onChange }));
}

export function EditorPopup(props) {
  const { children, content } = props;

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
      usePortal: true,
    },
    children
  );
}
