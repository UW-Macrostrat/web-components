import {createContext} from "react"
import h from '@macrostrat/hyper'

LithologyContext = createContext {lithologies: []}

LithologyProvider = (props)->
  {lithologies, children} = props
  h LithologyContext.Provider, {value: {lithologies}}, children

export {LithologyContext, LithologyProvider}
