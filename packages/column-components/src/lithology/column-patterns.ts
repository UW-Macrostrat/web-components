import { useContext, createContext } from "react"
import h, { compose } from "@macrostrat/hyper"
import { ColumnContext } from "../context"
import { GeologicPattern, GeologicPatternContext } from "./patterns"
import { UUIDProvider, useUUID } from "../frame"

interface LithologySymbolCtx {
  resolveID(div: any): string
}

const LithologySymbolContext = createContext<LithologySymbolCtx | null>(null)

const LithologySymbolDefs = function(props) {
  let { resolveID, UUID, scalePattern } = props
  const { divisions: allDivisions } = useContext(ColumnContext)
  const divisions = props.divisions ?? allDivisions

  let patternIDs = divisions.map(d => resolveID(d))
  // deduplicate pattern IDs
  patternIDs = Array.from(new Set(patternIDs))

  return h(
    "defs",
    patternIDs.map(function(id, i) {
      if (id === -1) {
        return null
      }
      let sz = 100
      if (scalePattern != null) {
        sz *= scalePattern(id)
      }
      return h(GeologicPattern, {
        key: i,
        prefix: UUID,
        id,
        width: sz,
        height: sz,
      })
    })
  )
}

type LithProviderProps = React.PropsWithChildren<LithologySymbolCtx>

function LithologyPatternProvider_(props: LithProviderProps) {
  /** A next-generation provider for lithology patterns in the context of an SVG.
   *  We should consider generalizing this further to work without needing the "resolveID" function.
   */
  const { resolveID, scalePattern, children } = props
  const value = { resolveID }
  const UUID = useUUID()
  return h(
    LithologySymbolContext.Provider,
    { value },
    h("g.patterns", [
      h(LithologySymbolDefs, { resolveID, scalePattern, UUID }),
      children,
    ])
  )
}

const LithologyPatternProvider = compose(
  UUIDProvider,
  LithologyPatternProvider_
)

function useLithologyPattern(d: any, fallback: string = "#aaa") {
  const { resolvePattern } = useContext(GeologicPatternContext)
  const ctx = useContext(LithologySymbolContext)
  const UUID = useUUID()
  if (ctx == null) return fallback
  const patternID = ctx.resolveID(d)
  let v = resolvePattern(patternID)
  console.log("Resolving pattern")
  return v != null ? `url(#${UUID}-${patternID})` : fallback
}

export { LithologyPatternProvider, useLithologyPattern, LithologySymbolDefs }
