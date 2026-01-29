import { useCallback, useEffect, useRef } from "react";
import { Box } from "@macrostrat/ui-components";
import h from "@macrostrat/hyper";
import { useColumn } from "../context";

interface ColumnScrollerProps {
  scrollToHeight: number;
  alignment: "center" | "top" | "bottom";
  animated: boolean;
  onScrolled: (height: number) => void;
  paddingTop: number;
  scrollContainer: () => HTMLElement;
}

interface ScrollToOpts {
  animated?: boolean;
  alignment?: "center" | "top" | "bottom";
}

export function ColumnScroller(props: ColumnScrollerProps) {
  const {
    onScrolled = defaultOnScrolled,
    scrollContainer = defaultGetScrollContainer,
    scrollToHeight,
    paddingTop,
    animated,
    alignment,
    ...rest
  } = props;

  const ref = useRef(null);
  const ctx = useColumn();
  const columnScale = ctx?.scale;

  const scrollTo = useCallback(
    (height: number, opts: ScrollToOpts) => {
      let node = ref.current;
      if (node == null || columnScale == null) return;
      let { animated, alignment } = opts;
      if (animated == null) {
        animated = false;
      }
      const pixelOffset = columnScale(height);
      const { top } = node.getBoundingClientRect();

      node = scrollContainer();
      let pos = pixelOffset + top + paddingTop;
      const screenHeight = window.innerHeight;

      if (alignment === "center") {
        pos -= screenHeight / 2;
      } else if (alignment === "bottom") {
        pos -= screenHeight;
      }
      if (animated && "scrollBehavior" in document.documentElement.style) {
        node.scrollTo({ top: pos, behavior: "smooth" });
      } else {
        node.scrollTop = pos;
      }
    },
    [onScrolled, scrollContainer, ref.current, columnScale, paddingTop],
  );

  useEffect(() => {
    const { scrollToHeight, alignment } = props;
    if (scrollToHeight == null) {
      return;
    }
    // Actually perform the scroll
    scrollTo(scrollToHeight, { alignment, animated });
    return onScrolled(scrollToHeight);
  }, [scrollTo, scrollToHeight]);

  const { pixelHeight } = this.context;
  return h(Box, {
    height: pixelHeight,
    position: "absolute",
    ref,
    ...rest,
  });
}

function defaultOnScrolled(height: number) {
  console.log(`Scrolled to ${height} m`);
}

function defaultGetScrollContainer() {
  // Todo: generalize this
  return document.querySelector(".panel-container");
}
