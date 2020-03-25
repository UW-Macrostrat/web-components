/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component, useState} from 'react';
import update from 'immutability-helper';

const useImmutableState = function(v){
  const [state, setState] = useState(v);
  const updateState = function(cset){
    const newState = update(state,cset);
    return setState(newState);
  };
  return [state, updateState];
};

class StatefulComponent extends Component {
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.updateState = this.updateState.bind(this);
    super(...args);
  }

  updateState(spec){
    const newState = update(this.state, spec);
    return this.setState(newState);
  }
}

export {StatefulComponent, useImmutableState};
