import {createContext, useContext} from "react"
import h from "@macrostrat/hyper"

interface IGeologicPattern {
  prefix: string
  id: string
  width: number
  height: number,
  name?: string
}

interface IGeologicPatternProvider {
  resolvePattern(string): string
}

const GeologicPatternContext = createContext<any>(null)

const GeologicPatternProvider = (props: IGeologicPatternProvider)=>{
  const {resolvePattern, children} = props
  return h(GeologicPatternContext.Provider, {
    value: {resolvePattern}, children
  })
}

const GeologicPattern = (props: IGeologicPattern)=> {
  const {resolvePattern} = useContext(GeologicPatternContext)
  const {prefix, width, height, id, name, ...rest} = props
  const patternSize = {width, height}

  return h('pattern', {
    id: `${prefix}-${name ?? id}`,
    patternUnits: "userSpaceOnUse",
    ...patternSize,
    ...rest
  }, [
    h.if(id != null)('image', {
      xlinkHref: resolvePattern(id),
      x:0,
      y:0,
      ...patternSize
    })
  ])
}

GeologicPattern.defaultProps = {
  width: 100,
  height: 100
}

export {GeologicPattern, GeologicPatternProvider, GeologicPatternContext}
