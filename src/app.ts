import h from '@macrostrat/hyper';
import {
  APIProvider,
  APIResultView
} from './ui-components';

const renderResults = (res)=> {
  const data = res.success.data;
  return h("div");
};

const MainView = => {
  return h(APIResultView, {
    route: "/units",
    params: {all: true, col_id: 495}
  });
};

const App = => {
  return h(APIProvider, {
    baseURL: "https://dev.macrostrat.org/api/v2",
    unwrapResponse: (res)=>res.success.data
  }, h(MainView));
};

export default App
