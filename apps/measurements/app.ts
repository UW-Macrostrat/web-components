import {useState} from 'react'
import {isEqual} from 'underscore'
import h from '@macrostrat/hyper';
import {Button} from "@blueprintjs/core"
import {
  APIProvider,
  APIResultView,
  useAPIResult,
  getQueryString,
  setQueryString
} from '@macrostrat/ui-components';
import {
  GeologicPatternProvider
} from '@macrostrat/column-components'
import Column, {IUnit} from './column'
import patterns from '../../geologic-patterns/*.png'
import {DetritalColumn} from "./detrital"
import {MapView, MeasurementsLayer} from "./map"
import {ColumnDataProvider, useColumnData} from "./column-data"
import {useColumnData} from "./column-data"

const ColumnTitle = (props)=>{
  return h.if(props.data != null)('h1', props.data?.col_name)
}

const ColumnUI = ({setCurrentColumn})=>{
  const {footprint, params, units} = useColumnData()

  // 495
  return h("div.column-ui", [
    h("div.main-panel", [
      h(ColumnTitle, {data: footprint?.properties}),
      h("div.flex-container.columns", [
        h("div.column-view", [
          h(Column, {data: units})
        ]),
        h(DetritalColumn, params),
      ])
    ]),
    h('div.map-column', [
      h(MapView, {currentColumn: footprint, setCurrentColumn, margin: 0}, [
        h(MeasurementsLayer)
      ]),
    ])
  )
}

const ColumnManager = ()=> {

  const defaultArgs = {col_id: 495}
  const initArgs = getQueryString() ?? defaultArgs
  const [columnArgs, setColumnArgs] = useState(initArgs)

  const setCurrentColumn = (obj)=>{
    let args = obj
    if ('properties' in obj) {
      args = {col_id: obj.properties.col_id}
    }
    // Set query string
    setQueryString(args)
    setColumnArgs(args)
  }

  return h(ColumnDataProvider, {params: columnArgs}, h(ColumnUI, {setCurrentColumn}))
};

const resolvePattern = (id)=>patterns[id]

const App = => {
  return h(GeologicPatternProvider, {resolvePattern}, (
    h(APIProvider, {
      baseURL: "https://dev.macrostrat.org/api/v2",
      unwrapResponse: (res)=>{
        return res.success.data
      }
    }, h(ColumnManager))
  )
}

export default App
