import {
  Component,
  createElement,
  createContext,
  useContext,
  useRef,
  ReactNode,
} from "react";
import hyper from "@macrostrat/hyper";
import { path } from "d3-path";
import { ColumnLayoutContext, ColumnLayoutCtx } from "./context";
import styles from "./frame.module.sass";
const h = hyper.styled(styles);

let sequence = 0; // Initialize a sequence counter
function getUniqueIdentifier() {
  // Generate a unique identifier using a sequential method that is stable across repeated
  // re-renders. This evolves from a UUID-based approach for SSR (server-side rendering) compatibility.
  const id = `uuid-${sequence}`;
  sequence += 1; // Increment the sequence for the next call
  return id;
}

class UUIDComponent<T> extends Component<T> {
  UUID: string;
  constructor(props: T) {
    super(props);
    this.UUID = getUniqueIdentifier();
  }
}

const UUIDContext = createContext<string | null>(null);

function useBasicUUID() {
  const ref = useRef<string>(getUniqueIdentifier());
  return ref.current;
}

const useUUID = function () {
  const uuid = useContext(UUIDContext);
  if (uuid == null) {
    return useBasicUUID();
  }
  return uuid;
};

function UUIDProvider({ children }) {
  const ref = useRef<string>(getUniqueIdentifier());
  return h(UUIDContext.Provider, { value: ref.current, children });
}

interface FrameProps {
  id: string;
  className?: string;
}

function SimpleFrame(props: FrameProps) {
  const { pixelHeight: height, width } = useContext(ColumnLayoutContext);
  let { id: frameID, className } = props;
  if (frameID.startsWith("#")) {
    frameID = frameID.slice(1);
  }
  return h("rect", {
    id: frameID,
    x: 0,
    y: 0,
    width,
    height,
    className,
  });
}

interface GrainsizeFrameProps {
  id: string;
}

function GrainsizeFrame(props: GrainsizeFrameProps) {
  let { id: frameID } = props;

  const {
    scale,
    divisions,
    grainsizeScale: gs,
  } = useContext(ColumnLayoutContext);
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
  let div: any = null;
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
  prefixes: string[],
): Record<string, string> {
  const res = {};
  for (let prefix of Array.from(prefixes)) {
    res[prefix + "ID"] = `#${uuid}-${prefix}`;
  }
  return res;
};

export interface ClipToFrameProps {
  left: number;
  shiftY: number;
  onClick?: () => void;
  frame?: any;
  width?: number;
  className?: string;
  children?: ReactNode;
  clip?: boolean;
}

export function ClippingFrame(props: ClipToFrameProps) {
  const {
    left = 0,
    shiftY = 0,
    className,
    onClick,
    children,
    frame = SimpleFrame,
    clip = true,
  } = props;

  const uuid = useUUID();

  const { frameID, clipID } = prefixID(uuid, ["frame", "clip"]);

  let transform = null;
  if (left != null) {
    transform = `translate(${left} ${shiftY})`;
  }

  const frameClassName = "frame";

  let _frame: ReactNode = h(frame, { id: frameID, className: frameClassName });
  let defs = null;
  let clipPath = null;
  if (clip) {
    defs = h("defs", { key: "defs" }, [
      _frame,
      h(ClipPath, { id: clipID }, h(UseFrame, { id: frameID })),
    ]);
    clipPath = `url(${clipID})`;
    _frame = h(UseFrame, { id: frameID, className: frameClassName });
  }

  return h("g", { className, transform, onClick }, [
    defs,
    _frame,
    h("g.inner", { clipPath }, children),
  ]);
}

export {
  SimpleFrame,
  GrainsizeFrame,
  ClipPath,
  UUIDComponent,
  UUIDProvider,
  useUUID,
};
