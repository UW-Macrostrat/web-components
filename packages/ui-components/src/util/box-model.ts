export interface StrictPadding {
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
}

export interface Padding extends Partial<StrictPadding> {
  paddingV?: number;
  paddingH?: number;
  padding?: number;
}

export interface StrictMargin {
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
}

export interface Margin extends Partial<StrictMargin> {
  marginV?: number;
  marginH?: number;
  margin?: number;
}

const keys = function (main) {
  const allKeys = ["", "V", "H", "Left", "Right", "Top", "Bottom"];
  return allKeys.map((d) => main + d);
};

const keyRemover = (type) =>
  function (obj) {
    let o1 = obj;
    for (let key of keys(type)) {
      delete o1[key];
    }
    return o1;
  };

const removeMargin = keyRemover("margin");
const removePadding = keyRemover("padding");

function extractMargin<T extends object>(
  obj: T & Margin,
  remove = false
): StrictMargin {
  /*
  I'm really annoyed I can't find a third-party implementation
  of this that covers edge cases...
  This eventually is useful for a React version of the SVG "margin convention"
  https://bl.ocks.org/mbostock/3019563
  */
  let {
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    marginV,
    marginH,
    margin,
  } = obj;
  if (margin == null) {
    margin = 0;
  }
  if (marginV == null) {
    marginV = margin;
  }
  if (marginH == null) {
    marginH = margin;
  }
  if (marginLeft == null) {
    marginLeft = marginH;
  }
  if (marginRight == null) {
    marginRight = marginH;
  }
  if (marginTop == null) {
    marginTop = marginV;
  }
  if (marginBottom == null) {
    marginBottom = marginV;
  }

  if (remove) {
    removeMargin(obj);
  }

  return { marginLeft, marginRight, marginTop, marginBottom };
}

function extractPadding<T>(obj: Padding & T, remove = false): StrictPadding {
  /*
  I'm really annoyed I can't find a third-party implementation
  of this that covers edge cases...
  This eventually is useful for a React version of the SVG "padding convention"
  https://bl.ocks.org/mbostock/3019563
  */
  let {
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    paddingV,
    paddingH,
    padding,
  } = obj;
  if (padding == null) {
    padding = 0;
  }
  if (paddingV == null) {
    paddingV = padding;
  }
  if (paddingH == null) {
    paddingH = padding;
  }
  if (paddingLeft == null) {
    paddingLeft = paddingH;
  }
  if (paddingRight == null) {
    paddingRight = paddingH;
  }
  if (paddingTop == null) {
    paddingTop = paddingV;
  }
  if (paddingBottom == null) {
    paddingBottom = paddingV;
  }

  if (remove) {
    removePadding(obj);
  }

  return { paddingLeft, paddingRight, paddingTop, paddingBottom };
}

function expandMargin<T extends object>(obj: T & Margin): T & StrictMargin {
  const margin = extractMargin(obj);
  let o1 = { ...obj };
  for (let key of ["margin", "marginV", "marginH"]) {
    delete o1[key];
  }
  return { ...o1, ...margin };
}

function expandPadding<T extends object>(obj: T & Padding): T & StrictPadding {
  const margin = extractPadding(obj);
  let o1 = { ...obj };
  for (let key of ["padding", "paddingV", "paddingH"]) {
    delete o1[key];
  }
  return { ...o1, ...margin };
}

function expandInnerSize<T>(
  obj: T &
    Padding & {
      innerHeight?: number;
      innerWidth?: number;
      width?: number;
      height?: number;
    }
): T & {
  height?: number;
  width?: number;
} {
  const n = expandPadding(obj);
  const { innerHeight, innerWidth, height, width, ...rest } = n;
  if (innerHeight != null) {
    if (n.height == null) {
      n.height = innerHeight + n.paddingTop + n.paddingBottom;
    }
  }
  if (innerWidth != null) {
    if (n.width == null) {
      n.width = innerWidth + n.paddingLeft + n.paddingRight;
    }
  }
  delete n.innerHeight;
  delete n.innerWidth;
  return n;
}

export {
  extractMargin,
  extractPadding,
  expandMargin,
  expandPadding,
  expandInnerSize,
  removeMargin,
  removePadding,
};
