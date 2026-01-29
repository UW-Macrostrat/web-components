import { format } from "d3-format";
import {
  Component,
  useContext,
  MouseEvent,
  ReactNode,
  createRef,
  RefObject,
} from "react";
import h from "./hyper";
import { Popover, Position, Button, Intent } from "@blueprintjs/core";
import {
  ColumnLayoutContext,
  ColumnLayoutCtx,
  ColumnDivision,
} from "./context";
import chroma from "chroma-js";
import { Box }  from "@macrostrat/ui-components";

const fmt = format(".1f");
const fmt2 = format(".2f");

const IntervalNotification = function (props) {
  const { id, height, bottom, top, surface } = props;
  return h("div", [
    h("h4", `Section ${id} @ ${fmt(height)} m`),
    h("p", ["Interval ID: ", h("code", id)]),
    h("p", `${bottom} - ${top} m`),
    surface ? h("p", ["Surface: ", h("code", surface)]) : null,
  ]);
};

const PopoverEditorTitle = function (props) {
  const { interval, children } = props;
  return h("div.interval-editor-title", [
    h("h3", `${fmt2(interval.bottom)}–${fmt2(interval.top)} m`),
    h("div.id", [h("code", interval.id)]),
    children,
  ]);
};

type color = string;

interface OverlayBoxProps {
  division: ColumnDivision;
  background: color;
  className: string;
  children?: ReactNode;
  onClick?: (evt: MouseEvent) => void;
}

const OverlayBox = (props: OverlayBoxProps) => {
  const { division, background, className, onClick } = props;
  const { widthForDivision, scaleClamped } = useContext(ColumnLayoutContext);

  if (scaleClamped == null) return null;

  const top = scaleClamped(division.top);
  const bottom = scaleClamped(division.bottom);
  const height = bottom - top;

  const width = widthForDivision(division);

  const style = {
    marginTop: top,
    height,
    width,
    pointerEvents: "none",
    position: "absolute",
  };

  return h("div", { style }, [
    h("div", {
      onClick,
      className,
      style: {
        cursor: onClick != null ? "pointer" : null,
        width: "100%",
        height: "100%",
        background,
      },
    }),
    props.children,
  ]);
};

const EditingBox = function ({ division, color, ...rest }) {
  if (division == null) {
    return null;
  }
  if (color == null) {
    color = "red";
  }
  const background = chroma(color).alpha(0.5).css();
  return h(OverlayBox, {
    className: "editing-box",
    division,
    background,
    ...rest,
  });
};

interface DivisionEditOverlayProps {
  left: number;
  top: number;
  showInfoBox: boolean;
  onClick(ctx: {
    event?: MouseEvent;
    height: number;
    division?: ColumnDivision;
  }): void;
  allowEditing: boolean;
  renderEditorPopup(d: ColumnDivision): ReactNode;
  scaleToGrainsize: boolean;
  editingInterval: ColumnDivision;
  color: color;
  width: number;
  popoverWidth: number;
  selectedHeight: number;
}

interface DivisionEditOverlayState {
  height: number | null;
  hoveredDivision: ColumnDivision | null;
  popoverIsOpen: boolean;
}

export class DivisionEditOverlay extends Component<
  DivisionEditOverlayProps,
  DivisionEditOverlayState
> {
  static contextType = ColumnLayoutContext;
  static defaultProps = {
    onHoverInterval() {},
    onClick() {},
    left: 0,
    top: 0,
    showInfoBox: false,
    allowEditing: true,
    renderEditorPopup() {
      return null;
    },
    color: "red",
    popoverWidth: 340,
  };

  elementRef: RefObject<HTMLDivElement>;

  timeout: any;
  declare context: ColumnLayoutCtx<ColumnDivision>;
  constructor(props: DivisionEditOverlayProps) {
    super(props);
    this.onHoverInterval = this.onHoverInterval.bind(this);
    this.removeHoverBox = this.removeHoverBox.bind(this);
    this.heightForEvent = this.heightForEvent.bind(this);
    this.onEditInterval = this.onEditInterval.bind(this);
    this.onClick = this.onClick.bind(this);
    this.renderCursorLine = this.renderCursorLine.bind(this);
    this.renderHoveredBox = this.renderHoveredBox.bind(this);
    this.closePopover = this.closePopover.bind(this);
    this.state = {
      height: null,
      hoveredDivision: null,
      popoverIsOpen: false,
    };
    this.timeout = null;

    this.elementRef = createRef();
  }

  onHoverInterval(event) {
    event.stopPropagation();
    // findDOMNode might be slow but I'm not sure
    if (this.elementRef.current !== event.target) {
      return;
    }
    const height = this.heightForEvent(event);
    this.setState({ height });
    if (!this.props.allowEditing) {
      return;
    }
    const { divisions } = this.context;

    let division = null;
    for (let d of Array.from(divisions)) {
      if (d.bottom <= height && height < d.top) {
        division = d;
        break;
      }
    }
    if (division === this.state.hoveredDivision) {
      return;
    }
    this.setState({ hoveredDivision: division });
    if (this.timeout != null) {
      clearTimeout(this.timeout);
      return (this.timeout = null);
    }
  }

  removeHoverBox() {
    this.setState({ hoveredDivision: null, popoverIsOpen: false });
    return (this.timeout = null);
  }

  heightForEvent(event) {
    const { scale } = this.context;
    const { offsetY } = event.nativeEvent;
    return scale.invert(offsetY);
  }

  onEditInterval(event) {
    if (this.state.popoverIsOpen) {
      return;
    }
    // This could be moved to the actual interval
    // wrapped with a withRouter
    const { showInfoBox } = this.props;
    const { hoveredDivision } = this.state;
    const height = this.heightForEvent(event);
    event.stopPropagation();
    if (event.shiftKey && showInfoBox) {
      this.setState({ popoverIsOpen: true });
      return;
    }
    return this.props.onClick({ event, height, division: hoveredDivision });
  }

  onClick(event) {
    // This event handler might be unnecessary
    if (this.props.allowEditing) {
      return this.onEditInterval(event);
    }
    const height = this.heightForEvent(event);
    return this.props.onClick({ height });
  }

  renderCursorLine() {
    let { height, hoveredDivision } = this.state;
    const { scaleClamped } = this.context;
    // Show the height we have selected if we are not hovering
    const { selectedHeight } = this.props;
    if (height == null) {
      height = selectedHeight;
    }
    if (height == null) {
      return;
    }
    const style = {
      top: scaleClamped(height),
      height: 0,
      border: "0.5px solid black",
      width: this.context.widthForDivision(hoveredDivision),
      position: "absolute",
      pointerEvents: "none",
    };

    return h("div.cursor", { style }, [
      h(
        "div.cursor-position",
        {
          style: {
            pointerEvents: "none",
            fontWeight: "bold",
            fontSize: "12px",
            left: "2px",
            top: "-14px",
            position: "absolute",
            color: "black",
          },
        },
        [fmt2(height)],
      ),
    ]);
  }

  renderHoveredBox() {
    if (this.state.hoveredDivision == null) {
      return null;
    }
    const { popoverIsOpen, hoveredDivision: division } = this.state;
    const width = this.context.widthForDivision(division);
    const { color } = this.props;
    const background = chroma(color).alpha(0.3).css();

    return h(
      OverlayBox,
      {
        division,
        className: "hovered-box",
        background,
      },
      [
        h.if(this.props.renderEditorPopup != null)(
          Popover,
          {
            isOpen: popoverIsOpen && division != null,
            //style: { display: "block", width },
            position: Position.LEFT,
          },
          [
            h("div", {
              style: { width, height: 30, transform: "translate(0,-30)" },
            }),
            h(
              "div.editor-popover-contents",
              {
                style: {
                  width: this.props.popoverWidth,
                  padding: "10px",
                },
              },
              [
                h(
                  PopoverEditorTitle,
                  {
                    interval: division,
                  },
                  [
                    h(Button, {
                      icon: "cross",
                      minimal: true,
                      intent: Intent.WARNING,
                      onClick: this.closePopover.bind(this),
                    }),
                  ],
                ),
                this.props.renderEditorPopup(division),
              ],
            ),
          ],
        ),
      ],
    );
  }

  closePopover() {
    return this.setState({
      popoverIsOpen: false,
    });
  }

  render() {
    let { divisions, pixelHeight, width } = this.context;
    const { popoverIsOpen, hoveredDivision: division } = this.state;
    const { left, top, color } = this.props;
    if (width == null) {
      ({ width } = this.props);
    }

    return h(
      Box,
      {
        className: "edit-overlay",
        width,
        height: pixelHeight,
        ref: this.elementRef,
        style: {
          left,
          top,
          position: "absolute",
          zIndex: 18,
          pointerEvents: "all",
          cursor: "pointer",
        },
        onClick: this.onEditInterval,
        onMouseEnter: this.onHoverInterval,
        onMouseMove: this.onHoverInterval,
        onMouseLeave: () => {
          if (popoverIsOpen) {
            return;
          }
          this.setState({ height: null });
          return (this.timeout = setTimeout(this.removeHoverBox, 1000));
        },
      },
      [
        this.renderHoveredBox(),
        h(EditingBox, {
          division: this.props.editingInterval,
          color,
        }),
        this.renderCursorLine(),
      ],
    );
  }
}
