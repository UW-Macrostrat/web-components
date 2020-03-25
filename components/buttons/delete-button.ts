/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component} from 'react';
import h from 'react-hyperscript';
import {Intent, Button, Alert} from '@blueprintjs/core';

class DeleteButton extends Component {
  static initClass() {
    this.defaultProps = {
      handleDelete() {},
      alertContent: null,
      itemDescription: "this item"
    };
  }
  constructor(props){
    super(props);
    this.state = {alertIsShown: false};
  }

  render() {
    let {handleDelete, alertContent, itemDescription, ...rest} = this.props;
    const {alertIsShown} = this.state;

    alertContent = [
      "Are you sure you want to delete ",
      itemDescription,
      "?"
    ];

    const onCancel = () => {
      return this.setState({alertIsShown: false});
    };

    const onClick = () => {
      return this.setState({alertIsShown: true});
    };

    const intent = Intent.DANGER;
    const icon = 'trash';

    return h([
      h(Button, {onClick, icon, intent, ...rest}),
      h(Alert, {
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
      }, alertContent)
    ]);
  }
}
DeleteButton.initClass();

export {DeleteButton};
