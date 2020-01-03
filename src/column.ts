import h from '@macrostrat/hyper'
import {group} from 'd3-array'
import {
  ColumnProvider,
  ColumnSVG,
  LithologyColumn,
  ColumnAxis,
  ColumnContext,
  NotesColumn
} from './column-components'
import UnitsColumn from './units'
import UnitNamesColumn from './unit-names'
import {useContext} from 'react'
import "./column-components/main.styl"

export interface IUnit {
  unit_id: number,
  col_id: number,
  section_id: number,
  t_age: number,
  b_age: number
  [x: string]: any
}

interface IColumnProps {
  data: IUnit[]
}

const AgeAxis = ()=>{
  const {height} = useContext(ColumnContext)
  return h(ColumnAxis, {
    ticks: Math.round(height/10),
    showDomain: false
  })
}

const Section = (props: IColumnProps)=>{
  const {data} = props

  const notesOffset = 100

  return h(ColumnProvider, {
    divisions: data,
    range: [data[data.length-1].b_age, data[0].t_age],
    pixelsPerMeter: 4 // Actually pixels per myr
  }, [
    h(ColumnSVG, {
      width: 450,
      paddingLeft: 40,
      padding: 20,
      paddingV: 5
    }, [
      h(AgeAxis),
      h(UnitNamesColumn, {left: notesOffset, width: 200, paddingLeft: 30})
      h(UnitsColumn, {width: 90}),
    ])
  ])
}

const Column = (props: IColumnProps)=>{
  const {data} = props;

  let sectionGroups = Array.from(group(data, d=>d.section_id))

  sectionGroups.sort((a,b)=>a.t_age-b.t_age)

  return h("div.column", sectionGroups.map(([id,values])=>{
    return h(`div.section-${id}`, [
      h(Section, {data: values})
    ])
  }))
}

export default Column
