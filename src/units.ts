import h from '@macrostrat/hyper'
import {useContext} from 'react'
import {
  LithologyColumn,
  ColumnContext,
  ColumnLayoutContext
} from './column-components'

const Unit = (props)=>{
  const {division: d} = props
  const {scale} = useContext(ColumnContext)
  const {width} = useContext(ColumnLayoutContext)

  const y = scale(d.t_age)
  const height = scale(d.b_age)-y

  return h("rect.unit", {x: 0, y, width, height, fill: "#aaa"})
}

const UnitBoxes = (props)=>{
  const {divisions} = useContext(ColumnContext)

  return h('g.divisions', divisions.map(div =>{
    return h(Unit, {
      division: div
    })
  }))
}

const UnitsColumn = (props)=>{
  return h(LithologyColumn, {width: 100}, [
    h(UnitBoxes)
  ])
}

export default UnitsColumn
