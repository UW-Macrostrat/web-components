/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {createContext} from "react";
import h from '@macrostrat/hyper';

const LithologyContext = createContext({lithologies: []});

const LithologyProvider = function(props){
  const {lithologies, children} = props;
  return h(LithologyContext.Provider, {value: {lithologies}}, children);
};

export {LithologyContext, LithologyProvider};
