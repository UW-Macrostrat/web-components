import { createContext, useContext } from "react"
import h from "@macrostrat/hyper"

interface IGeologicPattern {
  prefix: string
  id: string
  width: number
  height: number
  backgroundColor?: string
  name?: string
  invert?: boolean
}

interface IGeologicPatternProvider {
  resolvePattern(string): string
}

const GeologicPatternContext = createContext<any>(null)

const GeologicPatternProvider = (props: IGeologicPatternProvider) => {
  const { resolvePattern, children } = props
  return h(GeologicPatternContext.Provider, {
    value: { resolvePattern },
    children,
  })
}

const GeologicPattern = (props: IGeologicPattern) => {
  const { resolvePattern } = useContext(GeologicPatternContext)
  let {
    prefix,
    backgroundColor,
    color,
    invert,
    width,
    height,
    id,
    name,
    ...rest
  } = props
  const patternSize = { width, height }
  const patternBounds = { x: 0, y: 0, ...patternSize }

  // Compositing if we want to set overlay color
  // let overlayStyles = {}
  // if (color != null) {
  //   overlayStyles = {mixB}
  // }
  if (invert ?? false) {
    color = props.backgroundColor
    backgroundColor = props.color
  }

  const patternID = `${prefix}-${name ?? id}`
  const maskID = `${patternID}-mask`

  return h(
    "pattern",
    {
      id: patternID,
      patternUnits: "userSpaceOnUse",
      ...patternSize,
      ...rest,
    },
    [
      h("g", { style: { isolation: "isolate" } }, [
        // Mask, if required
        h.if(color != null && id != null)("mask", { id: maskID }, [
          h("image", {
            xlinkHref: resolvePattern(id),
            ...patternBounds,
          }),
        ]),
        h.if(backgroundColor != null)("rect", {
          ...patternBounds,
          fill: backgroundColor,
        }),
        // Render a masked colored image
        h.if(color != null)("rect", {
          ...patternBounds,
          fill: color,
          mask: `url(#${maskID})`,
        }),
        // Or render the image as normal
        h.if(id != null && color == null)("image", {
          xlinkHref: resolvePattern(id),
          ...patternBounds,
        }),
      ]),
    ]
  )
}

GeologicPattern.defaultProps = {
  width: 100,
  height: 100,
}

export { GeologicPattern, GeologicPatternProvider, GeologicPatternContext }
