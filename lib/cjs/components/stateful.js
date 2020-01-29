'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../_virtual/_rollupPluginBabelHelpers.js');
var react = require('react');
var update = _interopDefault(require('immutability-helper'));

var StatefulComponent =
/*#__PURE__*/
function (_Component) {
  __chunk_1.inherits(StatefulComponent, _Component);

  function StatefulComponent(props) {
    var _this;

    __chunk_1.classCallCheck(this, StatefulComponent);

    _this = __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(StatefulComponent).call(this, props));

    _this.updateState.bind(__chunk_1.assertThisInitialized(_this));

    return _this;
  }

  __chunk_1.createClass(StatefulComponent, [{
    key: "updateState",
    value: function updateState(spec) {
      var newState = update(this.state, spec);
      this.setState(newState);
    }
  }]);

  return StatefulComponent;
}(react.Component);

exports.StatefulComponent = StatefulComponent;
//# sourceMappingURL=stateful.js.map
