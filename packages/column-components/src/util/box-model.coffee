extractMargin = (obj)->
  ###
  I'm really annoyed I can't find a third-party implementation
  of this that covers edge cases...
  This eventually is useful for a React version of the SVG "margin convention"
  https://bl.ocks.org/mbostock/3019563
  ###
  {marginLeft, marginRight, marginTop, marginBottom,
   marginV, marginH, margin} = obj
  margin ?= 0
  marginV ?= margin
  marginH ?= margin
  marginLeft ?= marginH
  marginRight ?= marginH
  marginTop ?= marginV
  marginBottom ?= marginV
  {marginLeft, marginRight, marginTop, marginBottom}

extractPadding = (obj)->
  ###
  I'm really annoyed I can't find a third-party implementation
  of this that covers edge cases...
  This eventually is useful for a React version of the SVG "padding convention"
  https://bl.ocks.org/mbostock/3019563
  ###
  {paddingLeft, paddingRight, paddingTop, paddingBottom,
   paddingV, paddingH, padding} = obj
  padding ?= 0
  paddingV ?= padding
  paddingH ?= padding
  paddingLeft ?= paddingH
  paddingRight ?= paddingH
  paddingTop ?= paddingV
  paddingBottom ?= paddingV
  {paddingLeft, paddingRight, paddingTop, paddingBottom}

expandMargin = (obj)->
  margin = extractMargin(obj)
  for key in ['margin', 'marginV', 'marginH']
    delete obj[key]
  return {obj..., margin...}

expandPadding = (obj)->
  margin = extractPadding(obj)
  for key in ['padding', 'paddingV', 'paddingH']
    delete obj[key]
  return {obj..., margin...}

expandInnerSize = (obj)->
  n = expandPadding(obj)
  {innerHeight, innerWidth, height, width, rest...} = n
  if innerHeight?
    n.height ?= innerHeight + n.paddingTop + n.paddingBottom
  if innerWidth?
    n.width ?= innerWidth + n.paddingLeft + n.paddingRight
  return n

export {
  extractMargin,
  extractPadding,
  expandMargin,
  expandPadding,
  expandInnerSize
}
