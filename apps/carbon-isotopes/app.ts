import {useState} from 'react'
import h from '@macrostrat/hyper';
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

  return h("div.column-ui",[
    h("div.column-view", [
      h(ColumnTitle, {data: columnFeature?.properties}),
      h(Column, {params: columnArgs})
    ]),
    h("div.measurements", [
      h(APIResultView, {route: "/measurements", params: {
        ...columnArgs,
        show_values: true,
        response: 'long'
      }})
    ])
  ])
};

const resolvePattern = (id)=>patterns[id]

const App = => {
  return h(GeologicPatternProvider, {resolvePattern}, (
    h(APIProvider, {
      baseURL: "https://dev.macrostrat.org/api/v2",
      unwrapResponse: (res)=>res.success.data
    }, h(ColumnManager))
  )
}

export default App
