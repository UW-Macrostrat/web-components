import h from "@macrostrat/hyper";
import { DataEditor } from "react-datasheet/lib";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { SketchPicker } from "react-color";
import { Popover2 } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import chroma from "chroma-js";
import "./module.scss";

export function BasePopupEditor(props) {
  const { children, ...rest } = props;

  return h([
    h(DataEditor, rest),
    h("span.popover-container", [
      h(
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
            offset: { enabled: true, options: { offset: [0, 8] } },
          },
          interactionKind: "hover-target",
          isOpen: true,
          onClose(evt) {
            props.onKeyDown(evt);
          },
          usePortal: false,
        },
        h("span.popover-target")
      ),
    ]),
  ]);
}

export function ColorEditor(props) {
  const { value, onChange, ...rest } = props;
  let color = null;
  try {
    color = chroma(value).hex();
  } catch {}
  return h(
    BasePopupEditor,
    rest,
    h(SketchPicker, {
      disableAlpha: true,
      color: color ?? "#aaaaaa",
      onChange(color, evt) {
        let c = "";
        try {
          c = chroma(color.hex).name();
        } finally {
          onChange(c);
          evt.stopPropagation();
        }
      },
    })
  );
}
