/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component} from "react";
import h from "react-hyperscript";
import {Switch, Slider, Button} from "@blueprintjs/core";
import classNames from "classnames";

class PickerControl extends Component {
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.onUpdate = this.onUpdate.bind(this);
    super(...args);
  }

  static initClass() {
    this.defaultProps = {
      states : [
        {label: 'State 1', value: 'state1'},
        {label: 'State 2', value: 'state2'}
      ],
      vertical: true,
      isNullable: false
    };
  }
  render() {
    const {states, activeState, vertical} = this.props;
    let className = classNames('bp3-button-group', 'bp3-fill', {
      'bp3-vertical': vertical,
      'bp3-align-left': vertical
    });

    return h('div.picker-control', [
      h('div', {className}, states.map(d=> {
        className = classNames('bp3-button', {
          'bp3-active': this.props.activeState === d.value
        });
        return h('button', {
          type: 'button',
          className,
          onClick: this.onUpdate(d.value)
        }, d.label);
      })
      )
    ]);
  }
  onUpdate(value){ return () => {
    if (value === this.props.activeState) {
      if (!this.props.isNullable) { return; }
      value = null;
    }
    if (this.props.onUpdate == null) { return; }
    return this.props.onUpdate(value);
  }; }
}
PickerControl.initClass();

export {PickerControl};
