import {
  Component,
  createElement,
  createContext,
  useContext,
  useRef,
  ReactNode,
} from "react";
import h from "@macrostrat/hyper";
import { path } from "d3-path";
import { ColumnLayoutContext, ColumnLayoutCtx } from "./context";
import { v4 } from "uuid";

class UUIDComponent<T> extends Component<T> {
  UUID: string;
  constructor(props: T) {
    super(props);
    this.UUID = v4();
  }
}

const UUIDContext = createContext<string | null>(null);

const useUUID = () => useContext(UUIDContext) ?? v4();

function UUIDProvider({ children }) {
  const ref = useRef<string>(v4());
  return h(UUIDContext.Provider, { value: ref.current, children });
}

interface FrameProps {
  id: string;
}

class SimpleFrame extends Component<FrameProps> {
  static contextType = ColumnLayoutContext;
  context: ColumnLayoutCtx<any>;

  render() {
    const { pixelHeight: height, width } = this.context;
    let { id: frameID } = this.props;
    if (frameID.startsWith("#")) {
      frameID = frameID.slice(1);
    }
    return h("rect", { id: frameID, x: 0, y: 0, width, height, key: frameID });
  }
}

interface GrainsizeFrameProps {
  id: string;
}

class GrainsizeFrame extends Component<GrainsizeFrameProps> {
  static contextType = ColumnLayoutContext;
  context: ColumnLayoutCtx<any>;
  render() {
    let div;
    const { scale, divisions, grainsizeScale: gs } = this.context;
    let { id: frameID } = this.props;
    if (frameID.startsWith("#")) {
      frameID = frameID.slice(1);
    }
    if (divisions.length === 0) {
      return null;
    }

    const [bottomOfSection, topOfSection] = scale.domain();

    const topOf = function (d) {
      let { top } = d;
      if (top > topOfSection) {
        top = topOfSection;
      }
      return scale(top);
    };
    const bottomOf = function (d) {
      let { bottom } = d;
      if (bottom < bottomOfSection) {
        bottom = bottomOfSection;
      }
      return scale(bottom);
    };

    const filteredDivisions = divisions.filter(function (d) {
      if (d.top <= bottomOfSection) {
        return false;
      }
      if (d.bottom > topOfSection) {
        return false;
      }
      return true;
    });

    let _ = null;
    let currentGrainsize = "m";
    for (div of Array.from(filteredDivisions)) {
      if (_ == null) {
        _ = path();
        _.moveTo(0, bottomOf(div));
      }
      if (div.grainsize != null) {
        currentGrainsize = div.grainsize;
      }
      const x = gs(currentGrainsize);
      _.lineTo(x, bottomOf(div));
      _.lineTo(x, topOf(div));
    }
    _.lineTo(0, topOf(div));
    _.closePath();

    return h("path", {
      id: frameID,
      key: frameID,
      d: _.toString(),
    });
  }
}

const ClipPath = function (props) {
  let { id, children, ...rest } = props;
  if (id.startsWith("#")) {
    id = id.slice(1);
  }
  return createElement("clipPath", { id, key: id, ...rest }, children);
};

const UseFrame = function (props) {
  const { id: frameID, ...rest } = props;
  return h("use.frame", {
    xlinkHref: frameID,
    fill: "transparent",
    key: "frame",
    ...rest,
  });
};

const prefixID = function (
  uuid: string,
  prefixes: string[]
): Record<string, string> {
  const res = {};
  for (let prefix of Array.from(prefixes)) {
    res[prefix + "ID"] = `#${uuid}-${prefix}`;
  }
  return res;
};

interface ClipToFrameProps {
  left: number;
  shiftY: number;
  onClick: () => void;
  frame?: any;
  width?: number;
  className?: string;
  children?: ReactNode;
}

class ClipToFrame extends UUIDComponent<ClipToFrameProps> {
  constructor(props: ClipToFrameProps) {
    if (props.width == null && props.frame == null) {
      throw new Error("Provide either 'width' or 'frame' props");
    }

    super({ onClick: null, shiftY: 0, frame: null, width: null, ...props });
    this.computeTransform = this.computeTransform.bind(this);
  }

  computeTransform() {
    const { left, shiftY } = this.props;
    if (left == null) {
      return null;
    }
    return `translate(${left} ${shiftY})`;
  }
  render() {
    let { children, frame, className, onClick } = this.props;
    if (frame == null) {
      const { width } = this.props;
      frame = (props) => h(SimpleFrame, { width, ...props });
    }

    const transform = this.computeTransform();
    const { frameID, clipID } = prefixID(this.UUID, ["frame", "clip"]);

    return h("g", { className, transform, onClick }, [
      h("defs", { key: "defs" }, [
        h(frame, { id: frameID }),
        h(ClipPath, { id: clipID }, h(UseFrame, { id: frameID })),
      ]),
      h(
        "g.inner",
        {
          clipPath: `url(${clipID})`,
        },
        children
      ),
      h(UseFrame, { id: frameID }),
    ]);
  }
}

export {
  SimpleFrame,
  GrainsizeFrame,
  ClipPath,
  UUIDComponent,
  ClipToFrame,
  UUIDProvider,
  useUUID,
};
