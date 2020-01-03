import {createContext, useContext} from "react"
import h from "react-hyperscript"
import {createGrainsizeScale} from "../grainsize"

interface IGeologicPattern {
  UUID: string
  id: string
  width: number
  height: number
}

interface IGeologicPatternProvider {
  resolvePattern(string): string
}

const GeologicPatternContext = createContext()

const GeologicPatternProvider = (props: IGeologicPatternProvider)=>{
  const {resolvePattern, children} = props
  return h(GeologicPatternContext.Provider, {
    value: {resolvePattern}, children
  })
}

const GeologicPattern = (props: IGeologicPattern)=> {
  const {resolvePattern} = useContext(GeologicPatternContext)
  const {UUID, width, height, id: d} = props
  const patternSize = {width, height}

  const id = `${UUID}-${d}`

  return h('pattern', {
    id
    key: id
    patternUnits: "userSpaceOnUse"
    ...patternSize
  }, [
    h('image', {
      xlinkHref: resolvePattern(d)
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
