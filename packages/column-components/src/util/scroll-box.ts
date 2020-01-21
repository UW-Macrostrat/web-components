/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component, createRef} from 'react';
import {findDOMNode} from 'react-dom';
import { animateScroll, scroller, Element } from 'react-scroll';
import Box from 'ui-box';
import T from 'prop-types';
import h from '@macrostrat/hyper';

import {ColumnContext} from '../context';

const splitProps = function(keys, props){
  const obj = {};
  const rest = {};
  for (let k in props) {
    const v = props[k];
    if (keys.includes(k)) {
      obj[k] = v;
    } else {
      rest[k] = v;
    }
  }
  return [obj, rest];
};

class ColumnScroller extends Component {
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.scrollTo = this.scrollTo.bind(this);
    super(...args);
  }

  static initClass() {
    this.contextType = ColumnContext;
    this.propTypes = {
      scrollToHeight: T.number,
      alignment: T.oneOf(['center', 'top', 'bottom']),
      animated: T.bool,
      onScrolled: T.func,
      paddingTop: T.number,
      scrollContainer: T.func.isRequired
    };
    this.defaultProps = {
      animated: true,
      alignment: 'center',
      onScrolled(height){
        return console.log(`Scrolled to ${height} m`);
      },
      scrollContainer() {
        return document.querySelector('.panel-container');
      }
    };
  }
  render() {
    const keys = Object.keys(this.constructor.propTypes);
    const [props, rest] = splitProps(keys, this.props);
    const {pixelHeight} = this.context;
    return h(Box, {
      height: pixelHeight,
      position: 'absolute',
      ...rest
    });
  }

  scrollTo(height, opts={}){
    let node = findDOMNode(this);
    let {animated, alignment, ...rest} = opts;
    if (animated == null) { animated = false; }
    const {paddingTop} = this.props;
    const {scale} = this.context;
    const pixelOffset = scale(height);
    const {top} = node.getBoundingClientRect();

    node = this.props.scrollContainer();
    let pos = pixelOffset+top+paddingTop;
    const screenHeight = window.innerHeight;

    if (this.props.alignment === 'center') {
      pos -= screenHeight/2;
    } else if (this.props.alignment === 'bottom') {
      pos -= screenHeight;
    }

    return node.scrollTop = pos;
  }

  componentDidMount() {
    const {scrollToHeight, alignment} = this.props;
    if (scrollToHeight == null) { return; }
    this.scrollTo(scrollToHeight, {alignment, animated: false});
    return this.props.onScrolled(scrollToHeight);
  }

  componentDidUpdate(prevProps){
    const {scrollToHeight, animated, alignment} = this.props;
    if (scrollToHeight == null) { return; }
    if (prevProps.scrollToHeight === scrollToHeight) { return; }
    this.scrollTo(scrollToHeight, {alignment, animated});
    return this.props.onScrolled(scrollToHeight);
  }
}
ColumnScroller.initClass();

export {ColumnScroller};
