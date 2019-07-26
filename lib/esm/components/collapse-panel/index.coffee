import { Component } from 'react';
import h from 'react-hyperscript';
import { Button, Collapse } from '@blueprintjs/core';
import styled from '@emotion/styled';

// This component should be refactored into a shared UI component
var CollapsePanel, HeaderButton;

HeaderButton = styled(Button)`.bp3-button-text {\n  flex-grow: 1;\n  display: flex;\n}\n.bp3-button-text * {\n  display: inline;\n}\nspan.expander {\n  flex-grow: 1;\n}`;

CollapsePanel = (function() {
  class CollapsePanel extends Component {
    constructor(props) {
      super(props);
      this.state = {
        isOpen: false
      };
    }

    componentWillMount() {
      var isOpen, storageID;
      // Set open state from local storage if it is available
      ({storageID} = this.props);
      if (storageID == null) {
        return;
      }
      isOpen = this.savedState()[storageID];
      if (isOpen == null) {
        return;
      }
      return this.setState({isOpen});
    }

    /*
    Next functions are for state management
    across pages, if storageID prop is passed
    */
    savedState() {
      var st;
      try {
        st = window.localStorage.getItem('collapse-panel-state');
        return JSON.parse(st) || {};
      } catch (error) {
        return {};
      }
    }

    checkLocalStorage() {
      var isOpen, storageID;
      // Set open state from local storage if it is available
      ({storageID} = this.props);
      if (storageID == null) {
        return;
      }
      isOpen = this.savedState()[storageID] || null;
      if (isOpen == null) {
        isOpen = false;
      }
      return this.setState({isOpen});
    }

    componentDidUpdate(prevProps, prevState) {
      var isOpen, j, s, storageID;
      // Refresh object in local storage
      ({storageID} = this.props);
      if (storageID == null) {
        return;
      }
      ({isOpen} = this.state);
      if (isOpen === prevState.isOpen) {
        return;
      }
      s = this.savedState();
      s[storageID] = isOpen;
      j = JSON.stringify(s);
      return window.localStorage.setItem('collapse-panel-state', j);
    }

    render() {
      var children, headerRight, icon, isOpen, onClick, props, storageID, title;
      ({title, children, storageID, headerRight, ...props} = this.props);
      ({isOpen} = this.state);
      icon = isOpen ? 'collapse-all' : 'expand-all';
      onClick = () => {
        return this.setState({
          isOpen: !isOpen
        });
      };
      if (headerRight == null) {
        headerRight = null;
      }
      return h('div.collapse-panel', props, [
        h('div.panel-header',
        [
          h(HeaderButton,
          {
            icon,
            minimal: true,
            onClick,
            fill: true
          },
          [h('h2',
          title),
          h('span.expander')]),
          headerRight
        ]),
        h(Collapse,
        {isOpen},
        children)
      ]);
    }

  }
  CollapsePanel.defaultProps = {
    title: "Panel",
    // `storageID` prop allows storage of state in
    // localStorage or equivalent.
    storageID: null
  };

  return CollapsePanel;

}).call(undefined);

export { CollapsePanel };
