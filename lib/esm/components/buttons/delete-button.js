import { inherits as _inherits, classCallCheck as _classCallCheck, possibleConstructorReturn as _possibleConstructorReturn, getPrototypeOf as _getPrototypeOf, createClass as _createClass, objectWithoutProperties as _objectWithoutProperties, objectSpread2 as _objectSpread2 } from '../../_virtual/_rollupPluginBabelHelpers.js';
import { Component } from 'react';
import h from 'react-hyperscript';
import { Intent, Button, Alert } from '@blueprintjs/core';

var DeleteButton;

DeleteButton = function () {
  var DeleteButton =
  /*#__PURE__*/
  function (_Component) {
    _inherits(DeleteButton, _Component);

    function DeleteButton(props) {
      var _this;

      _classCallCheck(this, DeleteButton);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(DeleteButton).call(this, props));
      _this.state = {
        alertIsShown: false
      };
      return _this;
    }

    _createClass(DeleteButton, [{
      key: "render",
      value: function render() {
        var _this2 = this;

        var alertContent, alertIsShown, handleDelete, icon, intent, itemDescription, onCancel, onClick, rest;
        var _this$props = this.props;
        handleDelete = _this$props.handleDelete;
        alertContent = _this$props.alertContent;
        itemDescription = _this$props.itemDescription;
        rest = _objectWithoutProperties(_this$props, ["handleDelete", "alertContent", "itemDescription"]);
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

        intent = Intent.DANGER;
        icon = 'trash';
        return h([h(Button, _objectSpread2({
          onClick: onClick,
          icon: icon,
          intent: intent
        }, rest)), h(Alert, {
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
  }(Component);
  DeleteButton.defaultProps = {
    handleDelete: function handleDelete() {},
    alertContent: null,
    itemDescription: "this item"
  };
  return DeleteButton;
}.call(undefined);

export { DeleteButton };
//# sourceMappingURL=delete-button.js.map
