import h from '@macrostrat/hyper'
import {useContext} from 'react'
import {
  LithologyColumn,
  LithologySymbolDefs
  ColumnContext,
  ColumnLayoutContext
  defaultResolveID
  useUUID
} from '../column-components'
import {IUnit} from './types'

interface UnitProps {
  division: IUnit
  resolveID(IUnit): string
}

const Unit = (props: UnitProps)=>{
  const {division: d, resolveID} = props
  const {scale} = useContext(ColumnContext)
  const {width} = useContext(ColumnLayoutContext)

  const y = scale(d.t_age)
  const height = scale(d.b_age)-y

  console.log(d.lith)

  return h("rect.unit", {x: 0, y, width, height, fill: "#aaa"})
}

const UnitBoxes = (props)=>{
  const {divisions} = useContext(ColumnContext)
  const resolveID = defaultResolveID
  const UUID = useUUID()

  return h('g.divisions', [
    h(LithologySymbolDefs, {resolveID, UUID})
    h('g', divisions.map(div =>{
      return h(Unit, {
        division: div
        resolveID
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
