import h from '@macrostrat/hyper';
import {
  APIProvider,
  APIResultView
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

const ColumnView = => {
  // 495
  return h(APIResultView, {
    route: "/units",
    params: {all: true, col_id: 495, response: 'long'}
  }, renderResults);
};

const MainView = => {
  // 495
  return h('div.main', [
    h(MapView),
    h(ColumnView)
  ]);
};

const resolvePattern = (id)=>patterns[id]

const App = => {
  return h(GeologicPatternProvider, {resolvePattern}, (
    h(APIProvider, {
      baseURL: "https://dev.macrostrat.org/api/v2",
      unwrapResponse: (res)=>res.success.data
    }, h(MainView))
  )
}

export default App
