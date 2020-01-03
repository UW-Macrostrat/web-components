import h from '@macrostrat/hyper'
import {useContext} from 'react'
import {
  LithologyColumn,
  LithologyBoxes,
  LithologySymbolDefs
  ColumnContext,
  ColumnLayoutContext,
  GeologicPatternContext
  useUUID
} from '../column-components'
import {IUnit} from './types'
import {resolveID, scalePattern} from './resolvers'

interface UnitProps {
  division: IUnit
  resolveID(IUnit): string
  UUID: string
}

const Unit = (props: UnitProps)=>{
  const {division: d, resolveID, UUID} = props
  const {resolvePattern} = useContext(GeologicPatternContext)
  const {scale} = useContext(ColumnContext)
  const {width} = useContext(ColumnLayoutContext)

  const y = scale(d.t_age)
  const height = scale(d.b_age)-y

  const patternID = resolveID(d)
  const v = resolvePattern(patternID)

  const fill = (v != null) ? `url(#${UUID}-${patternID})` : '#aaa'

  return h("rect.unit", {x: 0, y, width, height, fill})
}

const UnitBoxes = (props)=>{
  const {divisions} = useContext(ColumnContext)
  const UUID = useUUID()

  return h('g.divisions', [
    h(LithologySymbolDefs, {resolveID, UUID, scalePattern})
    h('g', divisions.map(div =>{
      return h(Unit, {
        division: div
        resolveID
        UUID
      })
    }))
  ])
}

const UnitsColumn = (props)=>{
  return h(LithologyColumn, {width: 100}, [
    h(UnitBoxes)
  ])
}

export default UnitsColumn
