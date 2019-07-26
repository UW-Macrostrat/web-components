import { Component } from 'react';
import update from 'immutability-helper';

var StatefulComponent,
  boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

StatefulComponent = class StatefulComponent extends Component {
  constructor() {
    super(...arguments);
    this.updateState = this.updateState.bind(this);
  }

  updateState(spec) {
    var newState;
    boundMethodCheck(this, StatefulComponent);
    newState = update(this.state, spec);
    return this.setState(newState);
  }

};

export { StatefulComponent };
