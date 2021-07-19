// With Parcel v1, this file needs to be in the root directory.
// https://github.com/parcel-bundler/parcel/issues/2449
import '@macrostrat/ui-components/init';
import h from '~/hyper';
import {render} from 'react-dom';
import {App} from './src';

const el = document.querySelector("#app");
render(h(App), el);
