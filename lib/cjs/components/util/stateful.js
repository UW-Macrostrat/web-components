'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../../_virtual/_rollupPluginBabelHelpers.js');
var react = require('react');
var update = _interopDefault(require('immutability-helper'));

var boundMethodCheck = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};

exports.useImmutableState = function useImmutableState(v) {
  var setState, state, updateState;

  var _useState = react.useState(v);

  var _useState2 = __chunk_1.slicedToArray(_useState, 2);

  state = _useState2[0];
  setState = _useState2[1];

  updateState = function updateState(cset) {
    var newState;
    newState = update(state, cset);
    return setState(newState);
  };

  return [state, updateState];
};

exports.StatefulComponent =
/*#__PURE__*/
function (_Component) {
  __chunk_1.inherits(StatefulComponent, _Component);

  function StatefulComponent() {
    var _this;

    __chunk_1.classCallCheck(this, StatefulComponent);

    _this = __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(StatefulComponent).apply(this, arguments));
    _this.updateState = _this.updateState.bind(__chunk_1.assertThisInitialized(_this));
    return _this;
  }

  __chunk_1.createClass(StatefulComponent, [{
    key: "updateState",
    value: function updateState(spec) {
      var newState;
      boundMethodCheck(this, StatefulComponent);
      newState = update(this.state, spec);
      return this.setState(newState);
    }
  }]);

  return StatefulComponent;
}(react.Component);
//# sourceMappingURL=stateful.js.map
