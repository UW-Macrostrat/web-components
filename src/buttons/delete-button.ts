import {Component} from 'react';
import h from '@macrostrat/hyper';
import {Intent, Button, Alert} from '@blueprintjs/core';

class DeleteButton extends Component {
  static defaultProps = {
    handleDelete() {},
    alertContent: null,
    itemDescription: "this item"
  };
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

export {DeleteButton};
