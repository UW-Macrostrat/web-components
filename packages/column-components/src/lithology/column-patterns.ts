import { useContext, createContext, useState, useCallback } from "react"
import h, { compose, C } from "@macrostrat/hyper"
import { ColumnContext } from "../context"
import { GeologicPattern, GeologicPatternContext } from "./patterns"
import { UUIDProvider, useUUID } from "../frame"

interface PatternDefsCtx {
  trackPattern(id: string): void
}

const PatternDefsContext = createContext<PatternDefsCtx | null>(null)

interface GeologicPatternProps {
  patternIDs: Set<string | -1>
  scalePattern?(_: string): number
  UUID?: string
}

const GeologicPatternDefs = function(props: GeologicPatternProps) {
  let { patternIDs, scalePattern } = props
  const UUID = props.UUID ?? useUUID()

  return h(
    "defs",
    Array.from(patternIDs).map(function(id, i) {
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

const LithologySymbolDefs = function(props) {
  let { resolveID, UUID, scalePattern } = props
  const { divisions: allDivisions } = useContext(ColumnContext)
  const divisions = props.divisions ?? allDivisions

  let patternIDs = divisions.map(d => resolveID(d))
  // deduplicate pattern IDs
  patternIDs = Array.from(new Set(patternIDs))

  return h(GeologicPatternDefs, { UUID, scalePattern, patternIDs })
}

type LithProviderProps = React.PropsWithChildren<LithologySymbolCtx>

function PatternDefsProvider(props: LithProviderProps) {
  /** A next-generation provider for lithology patterns in the context of an SVG.
   *  We should consider generalizing this further to work without needing the "resolveID" function.
   */
  const { scalePattern, children } = props
  const [patternIDs, setPatternIDs] = useState<Set<string>>(new Set())

  const trackPattern = useCallback(
    (p: string) => {
      if (patternIDs.has(p)) return
      console.log("Tracking pattern", p)
      let newSet = new Set(patternIDs)
      newSet.add(p)
      setPatternIDs(newSet)
    },
    [patternIDs]
  )

  const value = { trackPattern }
  const Provider = compose(
    UUIDProvider,
    C(PatternDefsContext.Provider, { value })
  )

  return h(
    Provider,
    null,
    h("g.patterns", [
      h(GeologicPatternDefs, { scalePattern, patternIDs }),
      children,
    ])
  )
}

function useGeologicPattern(patternID: string, fallback: string = "#aaa") {
  const { resolvePattern } = useContext(GeologicPatternContext)
  const ctx = useContext(PatternDefsContext)
  const UUID = useUUID()
  let v = resolvePattern(patternID)
  if (v == null) return fallback
  ctx?.trackPattern(patternID)
  return `url(#${UUID}-${patternID})`
}

export { PatternDefsProvider, useGeologicPattern, LithologySymbolDefs }
