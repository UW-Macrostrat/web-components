/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component, Context } from "react";
import { findDOMNode } from "react-dom";
import Box from "ui-box";
import h from "@macrostrat/hyper";

import { ColumnContext, ColumnCtx } from "../context";
import { ColumnDivision } from "../defs";

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

const splitProps = function (keys, props) {
  const obj = {};
  const rest = {};
  for (let k in props) {
    const v = props[k];
    if (keys.includes(k)) {
      obj[k] = v;
    } else {
      rest[k] = v;
    }
  }
  return [obj, rest];
};

export class ColumnScroller extends Component<ColumnScrollerProps> {
  constructor(props) {
    super(props);
    this.scrollTo = this.scrollTo.bind(this);
  }

  private static defaultProps: Partial<ColumnScrollerProps> = {
    animated: true,
    alignment: "center",
    onScrolled(height) {
      return console.log(`Scrolled to ${height} m`);
    },
    scrollContainer() {
      return document.querySelector(".panel-container");
    },
  };

  static contextType: Context<ColumnCtx<ColumnDivision>> = ColumnContext;

  context: ColumnCtx<ColumnDivision>;

  render() {
    const keys = [
      "scrollToHeight",
      "alignment",
      "animated",
      "onScrolled",
      "paddingTop",
      "scrollContainer",
    ];
    const [props, rest] = splitProps(keys, this.props);
    const { pixelHeight } = this.context;
    return h(Box, {
      height: pixelHeight,
      position: "absolute",
      ...rest,
    });
  }

  scrollTo(height, opts: ScrollToOpts = {}) {
    let node = findDOMNode(this) as HTMLElement;
    let { animated, alignment, ...rest } = opts;
    if (animated == null) {
      animated = false;
    }
    const { paddingTop } = this.props;
    const { scale } = this.context;
    const pixelOffset = scale(height);
    const { top } = node.getBoundingClientRect();

    node = this.props.scrollContainer();
    let pos = pixelOffset + top + paddingTop;
    const screenHeight = window.innerHeight;

    if (this.props.alignment === "center") {
      pos -= screenHeight / 2;
    } else if (this.props.alignment === "bottom") {
      pos -= screenHeight;
    }

    return (node.scrollTop = pos);
  }

  componentDidMount() {
    const { scrollToHeight, alignment } = this.props;
    if (scrollToHeight == null) {
      return;
    }
    this.scrollTo(scrollToHeight, { alignment, animated: false });
    return this.props.onScrolled(scrollToHeight);
  }

  componentDidUpdate(prevProps) {
    const { scrollToHeight, animated, alignment } = this.props;
    if (scrollToHeight == null) {
      return;
    }
    if (prevProps.scrollToHeight === scrollToHeight) {
      return;
    }
    this.scrollTo(scrollToHeight, { alignment, animated });
    return this.props.onScrolled(scrollToHeight);
  }
}
