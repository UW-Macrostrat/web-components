import {useState} from 'react'
import h from '@macrostrat/hyper';
import {
  APIProvider,
  APIResultView,
  useAPIResult
} from '@macrostrat/ui-components';
import {
  GeologicPatternProvider
} from './column-components'
import Column, {IUnit} from './column'
import MapView from './map'
import patterns from '../geologic-patterns/*.png'

const renderResults = (data: Array<IUnit>)=> {
  return h(Column, {data});
};

const ColumnView = (props)=> {
  const {col_id} = props
  // 495
  return h(APIResultView, {
    route: "/units",
    params: {all: true, col_id, response: 'long'}
  }, renderResults);
};

const ColumnTitle = (props)=>{
  return h.if(props.data != null)('h1', props.data?.col_name)
}

const ColumnManager = => {
  const [col_id, setColumn] = useState(495)

  const res = useAPIResult('/columns', {col_id, format: 'geojson'})
  const columnFeature = res?.features[0]
  // 495
  return h([
    h("div.column-view", [
      h(ColumnTitle, {data: columnFeature?.properties}),
      h(ColumnView, {col_id})
    ]),
    h(MapView, {currentColumn: columnFeature}),
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
