export interface StrictPadding {
  paddingLeft: number,
  paddingRight: number,
  paddingTop: number,
  paddingBottom: number,
}

export interface Padding extends StrictPadding {
  paddingV: number,
  paddingH: number,
  padding: number
}

const keys = function(main){
  const allKeys = ["","V","H","Left","Right","Top","Bottom"];
  return allKeys.map(d => main+d);
};

const keyRemover = type => (function(obj) {
  for (let key of Array.from(keys(type))) {
    delete obj[key];
  }
  return obj;
});

const removeMargin = keyRemover("margin");
const removePadding = keyRemover("padding");

const extractMargin = function(obj, remove=false){
  /*
  I'm really annoyed I can't find a third-party implementation
  of this that covers edge cases...
  This eventually is useful for a React version of the SVG "margin convention"
  https://bl.ocks.org/mbostock/3019563
  */
  let {marginLeft, marginRight, marginTop, marginBottom,
   marginV, marginH, margin} = obj;
  if (margin == null) { margin = 0; }
  if (marginV == null) { marginV = margin; }
  if (marginH == null) { marginH = margin; }
  if (marginLeft == null) { marginLeft = marginH; }
  if (marginRight == null) { marginRight = marginH; }
  if (marginTop == null) { marginTop = marginV; }
  if (marginBottom == null) { marginBottom = marginV; }

  if (remove) { removeMargin(obj); }

  return {marginLeft, marginRight, marginTop, marginBottom};
};

const extractPadding = function(obj, remove=false){
  /*
  I'm really annoyed I can't find a third-party implementation
  of this that covers edge cases...
  This eventually is useful for a React version of the SVG "padding convention"
  https://bl.ocks.org/mbostock/3019563
  */
  let {paddingLeft, paddingRight, paddingTop, paddingBottom,
   paddingV, paddingH, padding} = obj;
  if (padding == null) { padding = 0; }
  if (paddingV == null) { paddingV = padding; }
  if (paddingH == null) { paddingH = padding; }
  if (paddingLeft == null) { paddingLeft = paddingH; }
  if (paddingRight == null) { paddingRight = paddingH; }
  if (paddingTop == null) { paddingTop = paddingV; }
  if (paddingBottom == null) { paddingBottom = paddingV; }

  if (remove) { removePadding(obj); }

  return {paddingLeft, paddingRight, paddingTop, paddingBottom};
};

const expandMargin = function(obj){
  const margin = extractMargin(obj);
  for (let key of ['margin', 'marginV', 'marginH']) {
    delete obj[key];
  }
  return {...obj, ...margin};
};

const expandPadding = function(obj){
  const margin = extractPadding(obj);
  for (let key of ['padding', 'paddingV', 'paddingH']) {
    delete obj[key];
  }
  return {...obj, ...margin};
};

const expandInnerSize = function(obj){
  const n = expandPadding(obj);
  const {innerHeight, innerWidth, height, width, ...rest} = n;
  if (innerHeight != null) {
    if (n.height == null) { n.height = innerHeight + n.paddingTop + n.paddingBottom; }
  }
  if (innerWidth != null) {
    if (n.width == null) { n.width = innerWidth + n.paddingLeft + n.paddingRight; }
  }
  delete n.innerHeight;
  delete n.innerWidth;
  return n;
};

export {
  extractMargin,
  extractPadding,
  expandMargin,
  expandPadding,
  expandInnerSize,
  removeMargin,
  removePadding
};
