import {render} from 'react-dom';
import h from '@macrostrat/hyper';

const App = => h("div", "Hello world!");

render(h(App), document.querySelector('#app'));
