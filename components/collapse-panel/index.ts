/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// This component should be refactored into a shared UI component

import {Component} from 'react';
import h from 'react-hyperscript';
import {Button, Collapse} from '@blueprintjs/core';
import './main.styl';
import styled from '@emotion/styled';

const HeaderButton = styled(Button)`\
.bp3-button-text {
  flex-grow: 1;
  display: flex;
}
.bp3-button-text * {
  display: inline;
}
span.expander {
  flex-grow: 1;
}\
`;

class CollapsePanel extends Component {
  static initClass() {
    this.defaultProps = {
      title: "Panel",
      // `storageID` prop allows storage of state in
      // localStorage or equivalent.
      storageID: null
    };
  }
  constructor(props){
    super(props);
    this.state = {isOpen: false};
  }

  componentWillMount() {
    // Set open state from local storage if it is available
    const {storageID} = this.props;
    if (storageID == null) { return; }
    const isOpen = this.savedState()[storageID];
    if (isOpen == null) { return; }
    return this.setState({isOpen});
  }

  /*
  Next functions are for state management
  across pages, if storageID prop is passed
  */
  savedState() {
    try {
      const st = window.localStorage.getItem('collapse-panel-state');
      return JSON.parse(st) || {};
    } catch (error) {
      return {};
    }
  }

  checkLocalStorage() {
    // Set open state from local storage if it is available
    const {storageID} = this.props;
    if (storageID == null) { return; }
    let isOpen = this.savedState()[storageID] || null;
    if (isOpen == null) { isOpen = false; }
    return this.setState({isOpen});
  }

  componentDidUpdate(prevProps, prevState){
    // Refresh object in local storage
    const {storageID} = this.props;
    if (storageID == null) { return; }
    const {isOpen} = this.state;
    if (isOpen === prevState.isOpen) { return; }
    const s = this.savedState();
    s[storageID] = isOpen;
    const j = JSON.stringify(s);
    return window.localStorage.setItem('collapse-panel-state', j);
  }

  render() {
    let {title, children, storageID, headerRight, ...props} = this.props;
    const {isOpen} = this.state;

    const icon = isOpen ? 'collapse-all' : 'expand-all';
    const onClick = () => this.setState({isOpen: !isOpen});

    if (headerRight == null) { headerRight = null; }

    return h('div.collapse-panel', props, [
      h('div.panel-header', [
        h(HeaderButton, {icon, minimal: true, onClick, fill: true}, [
          h('h2', title),
          h('span.expander')
        ]),
        headerRight
      ]),
      h(Collapse, {isOpen}, children)
    ]);
  }
}
CollapsePanel.initClass();

export {CollapsePanel};
