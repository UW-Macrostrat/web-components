import { inherits as _inherits, createClass as _createClass, classCallCheck as _classCallCheck, possibleConstructorReturn as _possibleConstructorReturn, getPrototypeOf as _getPrototypeOf, assertThisInitialized as _assertThisInitialized } from '../_virtual/_rollupPluginBabelHelpers.js';
import { Component } from 'react';
import update from 'immutability-helper';

var StatefulComponent =
/*#__PURE__*/
function (_Component) {
  _inherits(StatefulComponent, _Component);

  function StatefulComponent(props) {
    var _this;

    _classCallCheck(this, StatefulComponent);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(StatefulComponent).call(this, props));

    _this.updateState.bind(_assertThisInitialized(_this));

    return _this;
  }

  _createClass(StatefulComponent, [{
    key: "updateState",
    value: function updateState(spec) {
      var newState = update(this.state, spec);
      this.setState(newState);
    }
  }]);

  return StatefulComponent;
}(Component);

export { StatefulComponent };
//# sourceMappingURL=stateful.js.map
