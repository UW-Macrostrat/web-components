'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../../_virtual/_rollupPluginBabelHelpers.js');
var react = require('react');
var h = _interopDefault(require('react-hyperscript'));
var core = require('@blueprintjs/core');

exports.DeleteButton = function () {
  var DeleteButton =
  /*#__PURE__*/
  function (_Component) {
    __chunk_1.inherits(DeleteButton, _Component);

    function DeleteButton(props) {
      var _this;

      __chunk_1.classCallCheck(this, DeleteButton);

      _this = __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(DeleteButton).call(this, props));
      _this.state = {
        alertIsShown: false
      };
      return _this;
    }

    __chunk_1.createClass(DeleteButton, [{
      key: "render",
      value: function render() {
        var _this2 = this;

        var alertContent, alertIsShown, handleDelete, icon, intent, itemDescription, onCancel, onClick, rest;
        var _this$props = this.props;
        handleDelete = _this$props.handleDelete;
        alertContent = _this$props.alertContent;
        itemDescription = _this$props.itemDescription;
        rest = __chunk_1.objectWithoutProperties(_this$props, ["handleDelete", "alertContent", "itemDescription"]);
        alertIsShown = this.state.alertIsShown;
        alertContent = ["Are you sure you want to delete ", itemDescription, "?"];

        onCancel = function onCancel() {
          return _this2.setState({
            alertIsShown: false
          });
        };

        onClick = function onClick() {
          return _this2.setState({
            alertIsShown: true
          });
        };

        intent = core.Intent.DANGER;
        icon = 'trash';
        return h([h(core.Button, __chunk_1.objectSpread2({
          onClick: onClick,
          icon: icon,
          intent: intent
        }, rest)), h(core.Alert, {
          isOpen: alertIsShown,
          cancelButtonText: 'Cancel',
          confirmButtonText: 'Delete',
          icon: icon,
          intent: intent,
          onCancel: onCancel,
          onConfirm: function onConfirm() {
            handleDelete();
            return onCancel();
          }
        }, alertContent)]);
      }
    }]);

    return DeleteButton;
  }(react.Component);
  DeleteButton.defaultProps = {
    handleDelete: function handleDelete() {},
    alertContent: null,
    itemDescription: "this item"
  };
  return DeleteButton;
}.call(undefined);
//# sourceMappingURL=delete-button.js.map
