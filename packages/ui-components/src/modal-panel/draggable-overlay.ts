import h from "@macrostrat/hyper";
import { useState, useEffect, ReactChild, ReactElement } from "react";
import { Overlay, Card } from "@blueprintjs/core";

interface DraggableOverlayPropsI {
  open: boolean;
  children: ReactChild;
  HeaderComponent: ReactElement<any>;
  className: string;
  cardStyles: object;
  headerStyles: object;
  top: number;
  left: number;
}

function DraggableOverlay(props: DraggableOverlayPropsI) {
  const {
    open,
    children,
    headerStyles = {},
    className = "overlay",
    cardStyles = {},
    top = 100,
    left = 20,
  } = props;

  const [state, setState] = useState({ top, left });
  const [offset, setOffset] = useState({ rel_x: 0, rel_y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    //setup event listeners
    if (!dragging) return;
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);
    return () => {
      document.removeEventListener("mouseup", onMouseUp, true);
      document.removeEventListener("mousemove", onMouseMove, true);
    };
  }, [dragging]);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    setDragging(true);
    setOffset(getOffest(e));
  };

  const onMouseUp = (e) => {
    setDragging(false);
    e.stopPropagation();
    e.preventDefault();
  };

  const getOffest = (e) => {
    const rel_x = e.pageX - state.left;
    const rel_y = e.pageY - state.top;
    return { rel_x, rel_y };
  };

  const onMouseMove = (e) => {
    if (dragging) {
      const { rel_x, rel_y } = offset;
      const left_ = e.pageX - rel_x;
      const top_ = e.pageY - rel_y;
      setState({ top: top_, left: left_ });
    }
    e.stopPropagation();
    e.preventDefault();
  };

  const overlayProperties = {
    autoFocus: true,
    canEscapeKeyClose: true,
    canOutsideClickClose: true,
    enforceFocus: false,
    hasBackdrop: false,
    usePortal: true,
    useTallContent: false,
  };

  const style = { top: `${state.top}px`, left: `${state.left}px` };

  return h(Overlay, { isOpen: open, ...overlayProperties }, [
    h(`div.${className}`, { styles: style }, [
      h(Card, { style: cardStyles }, [
        h("div", { onMouseDown, styles: headerStyles }, [
          props.HeaderComponent,
        ]),
        children,
      ]),
    ]),
  ]);
}

export { DraggableOverlay };
