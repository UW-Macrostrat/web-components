import {useState} from 'react'
import h, {C, compose} from '@macrostrat/hyper';
import {
  APIProvider,
  APIResultView,
  useAPIResult,
  getQueryString,
} from '@macrostrat/ui-components';
import {
  GeologicPatternProvider
} from '@macrostrat/column-components'
import Column from './column'
import {MeasurementDataProvider} from "./data-provider"
import patterns from '../../geologic-patterns/*.png'

const ColumnTitle = (props)=>{
  return h.if(props.data != null)('h1', props.data?.col_name)
}

const ColumnManager = ()=> {

  const defaultArgs = {col_id: 2138, project_id: 10, status_code: "in process"}
  const initArgs = getQueryString() ?? defaultArgs
  const [columnArgs, setColumnArgs] = useState(initArgs)

  const colParams = {...columnArgs, format: 'geojson'}
  const res = useAPIResult('/columns', colParams, [columnArgs])
  const columnFeature = res?.features[0]

  return h(MeasurementDataProvider, columnArgs, [
    h("div.column-ui",[
      h("div.column-view", [
        h(ColumnTitle, {data: columnFeature?.properties}),
        h(Column, {params: columnArgs})
      ]),
    ])
  ])
};

const resolvePattern = (id)=>patterns[id]

const App = compose(
  C(GeologicPatternProvider, {resolvePattern}),
  C(APIProvider, {
    baseURL: "https://dev.macrostrat.org/api/v2",
    unwrapResponse: (res)=>res.success.data
  })
  ColumnManager
)

export default App
