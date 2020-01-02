import h from '@macrostrat/hyper';
import {
  APIProvider,
  APIResultView
} from './ui-components';
import Column, {IUnit} from './column'

const renderResults = (data: Array<IUnit>)=> {
  return h(Column, {data});
};

const MainView = => {
  return h(APIResultView, {
    route: "/units",
    params: {all: true, col_id: 495, long: true}
  }, renderResults);
};

const App = => {
  return h(APIProvider, {
    baseURL: "https://dev.macrostrat.org/api/v2",
    unwrapResponse: (res)=>res.success.data
  }, h(MainView));
};

export default App
