import { slicedToArray as _slicedToArray, inherits as _inherits, createClass as _createClass, classCallCheck as _classCallCheck, possibleConstructorReturn as _possibleConstructorReturn, getPrototypeOf as _getPrototypeOf, assertThisInitialized as _assertThisInitialized } from '../../_virtual/_rollupPluginBabelHelpers.js';
import { useState, Component } from 'react';
import update from 'immutability-helper';

var StatefulComponent,
    useImmutableState,
    boundMethodCheck = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};

useImmutableState = function useImmutableState(v) {
  var setState, state, updateState;

  var _useState = useState(v);

  var _useState2 = _slicedToArray(_useState, 2);

  state = _useState2[0];
  setState = _useState2[1];

  updateState = function updateState(cset) {
    var newState;
    newState = update(state, cset);
    return setState(newState);
  };

  return [state, updateState];
};

StatefulComponent =
/*#__PURE__*/
function (_Component) {
  _inherits(StatefulComponent, _Component);

  function StatefulComponent() {
    var _this;

    _classCallCheck(this, StatefulComponent);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(StatefulComponent).apply(this, arguments));
    _this.updateState = _this.updateState.bind(_assertThisInitialized(_this));
    return _this;
  }

  _createClass(StatefulComponent, [{
    key: "updateState",
    value: function updateState(spec) {
      var newState;
      boundMethodCheck(this, StatefulComponent);
      newState = update(this.state, spec);
      return this.setState(newState);
    }
  }]);

  return StatefulComponent;
}(Component);

export { StatefulComponent, useImmutableState };
//# sourceMappingURL=stateful.js.map
