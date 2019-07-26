import { Component } from 'react';
import h from 'react-hyperscript';
import { Intent, Alert, Button } from '@blueprintjs/core';

var DeleteButton;

DeleteButton = (function() {
  class DeleteButton extends Component {
    constructor(props) {
      super(props);
      this.state = {
        alertIsShown: false
      };
    }

    render() {
      var alertContent, alertIsShown, handleDelete, icon, intent, itemDescription, onCancel, onClick, rest;
      ({handleDelete, alertContent, itemDescription, ...rest} = this.props);
      ({alertIsShown} = this.state);
      alertContent = ["Are you sure you want to delete ", itemDescription, "?"];
      onCancel = () => {
        return this.setState({
          alertIsShown: false
        });
      };
      onClick = () => {
        return this.setState({
          alertIsShown: true
        });
      };
      intent = Intent.DANGER;
      icon = 'trash';
      return h('div.delete-control', [
        h(Alert,
        {
          isOpen: alertIsShown,
          cancelButtonText: 'Cancel',
          confirmButtonText: 'Delete',
          icon,
          intent,
          onCancel,
          onConfirm: () => {
            handleDelete();
            return onCancel();
          }
        },
        alertContent),
        h(Button,
        {onClick,
        icon,
        intent,
        ...rest})
      ]);
    }

  }
  DeleteButton.defaultProps = {
    handleDelete: function() {},
    alertContent: null,
    itemDescription: "this item"
  };

  return DeleteButton;

}).call(undefined);

export { DeleteButton };
