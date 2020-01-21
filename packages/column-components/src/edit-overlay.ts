/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {findDOMNode} from "react-dom";
import {format} from "d3-format";
import {Component, createElement, useContext} from "react";
import h from "./hyper";
import {Popover, Position, Button, Intent} from "@blueprintjs/core";
import {withRouter} from "react-router-dom";
import {ColumnLayoutContext} from './context';
import T from 'prop-types';
import chroma from 'chroma-js';
import Box from 'ui-box';

const fmt = format('.1f');
const fmt2 = format('.2f');

const IntervalNotification = function(props){
  const {id, height, bottom, top, surface} = props;
  return h('div', [
    h('h4', `Section ${id} @ ${fmt(height)} m`),
    h('p', [
      'Interval ID: ',
      h('code', id)
    ]),
    h('p', `${bottom} - ${top} m`),
    surface ? h('p', ["Surface: ", h('code',surface)]) : null
  ]);
};

const PopoverEditorTitle = function(props){
  const {interval, children} = props;
  return h('div.interval-editor-title', [
    h('h3', `${fmt2(interval.bottom)}–${fmt2(interval.top)} m`),
    h('div.id', [
      h('code', interval.id)
    ]),
    children
  ]);
};


class OverlayBox extends Component {
  static initClass() {
    this.contextType = ColumnLayoutContext;
  }
  render() {
    const {division, background, className, onClick} = this.props;
    const {widthForDivision, scaleClamped} = this.context;

    const top = scaleClamped(division.top);
    const bottom = scaleClamped(division.bottom);
    const height = bottom-top;

    const width = widthForDivision(division);

    const style = {
      marginTop: top,
      height,
      width,
      pointerEvents: 'none',
      position: 'absolute'
    };

    return h('div', {style}, [
      h('div', {
        onClick,
        className,
        style: {
          cursor: (onClick != null) ? 'pointer' : null,
          width: '100%',
          height: '100%',
          background
        }
      }),
      this.props.children
    ]);
  }
}
OverlayBox.initClass();

OverlayBox.propTypes = {
  division: T.object
};

const EditingBox = function({division, color, ...rest}){
  if (division == null) { return null; }
  if (color == null) { color = "red"; }
  const background = chroma(color).alpha(0.5).css();
  return h(OverlayBox, {
    className: 'editing-box',
    division,
    background,
    ...rest
  });
};

class DivisionEditOverlay extends Component {
  static initClass() {
    this.contextType = ColumnLayoutContext;
    this.propTypes = {
      left: T.number,
      top: T.number,
      showInfoBox: T.bool,
      onClick: T.func,
      allowEditing: T.bool,
      renderEditorPopup: T.func,
      scaleToGrainsize: T.bool,
      editingInterval: T.object,
      color: T.string,
      width: T.number,
      popoverWidth: T.number
    };
    this.defaultProps = {
      onHoverInterval() {},
      onClick() {},
      left: 0,
      top: 0,
      showInfoBox: false,
      allowEditing: true,
      renderEditorPopup() { return null; },
      color: 'red',
      popoverWidth: 340
    };
  }
  constructor(props){
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.onHoverInterval = this.onHoverInterval.bind(this);
    this.removeHoverBox = this.removeHoverBox.bind(this);
    this.heightForEvent = this.heightForEvent.bind(this);
    this.onEditInterval = this.onEditInterval.bind(this);
    this.onClick = this.onClick.bind(this);
    this.renderCursorLine = this.renderCursorLine.bind(this);
    this.renderHoveredBox = this.renderHoveredBox.bind(this);
    this.closePopover = this.closePopover.bind(this);
    super(props);
    this.state = {
      height: null,
      hoveredDivision: null,
      popoverIsOpen: false
    };
    this.timeout = null;
  }

  onHoverInterval(event){
    event.stopPropagation();
    // findDOMNode might be slow but I'm not sure
    if (findDOMNode(this) !== event.target) { return; }
    const height = this.heightForEvent(event);
    this.setState({height});
    if (!this.props.allowEditing) { return; }
    const {divisions} = this.context;

    let division = null;
    for (let d of Array.from(divisions)) {
      if (d.bottom <= height && height < d.top) {
        division = d;
        break;
      }
    }
    if (division === this.state.hoveredDivision) { return; }
    this.setState({hoveredDivision: division});
    if (this.timeout != null) {
      clearTimeout(this.timeout);
      return this.timeout = null;
    }
  }

  removeHoverBox() {
    this.setState({hoveredDivision: null, popoverIsOpen: false});
    return this.timeout = null;
  }

  heightForEvent(event){
    const {scale} = this.context;
    const {offsetY} = event.nativeEvent;
    return scale.invert(offsetY);
  }

  onEditInterval(event){
    if (this.state.popoverIsOpen) {
      return;
    }
    // This could be moved to the actual interval
    // wrapped with a withRouter
    const {history, showInfoBox} = this.props;
    const {hoveredDivision} = this.state;
    const height = this.heightForEvent(event);
    event.stopPropagation();
    if (event.shiftKey && showInfoBox) {
      this.setState({popoverIsOpen: true});
      return;
    }
    return this.props.onClick({height, division: hoveredDivision});
  }

  onClick(event){
    // This event handler might be unnecessary
    if (this.props.allowEditing) {
      return this.onEditInterval(event);
    }
    const height = this.heightForEvent(event);
    return this.props.onClick({height});
  }

  renderCursorLine() {
    const {height, hoveredDivision} = this.state;
    const {scaleClamped} = this.context;
    if (height == null) { return; }
    const style = {
      top: scaleClamped(height),
      height: 0,
      border: "0.5px solid black",
      width: this.context.widthForDivision(hoveredDivision),
      position: 'absolute',
      pointerEvents: 'none'
    };

    return h('div.cursor', {style}, [
      h('div.cursor-position', {style: {
        pointerEvents: 'none',
        fontWeight: 'bold',
        fontSize: '12px',
        left: '2px',
        top: '-14px',
        position: 'absolute',
        color: 'black'
      }}, [
        fmt2(height)
      ])
    ]);
  }

  renderHoveredBox() {
    if (this.state.hoveredDivision == null) { return null; }
    const {popoverIsOpen, hoveredDivision: division} = this.state;
    const width = this.context.widthForDivision(division);
    const {color} = this.props;
    const background = chroma(color).alpha(0.3).css();

    return h(OverlayBox, {
      division,
      className: 'hovered-box',
      background
    }, [
      h.if(this.props.renderEditorPopup)(Popover, {
        isOpen: popoverIsOpen && (division != null),
        style: {display: 'block', width},
        position: Position.LEFT
      }, [
        h('div', {style: {width, height: 30, transform: "translate(0,-30)"}}),
        h('div.editor-popover-contents', {
          style: {
            width: this.props.popoverWidth,
            padding: '10px'
          }
        }, [
          h(PopoverEditorTitle, {
            interval: division
          }, [
            h(Button, {
              icon: 'cross',
              minimal: true,
              intent: Intent.WARNING,
              onClick: this.closePopover
            })

          ]),
          this.props.renderEditorPopup(division)
        ])
      ])
    ]);
  }

  closePopover() {
    return this.setState({
      popoverIsOpen: false
    });
  }

  render() {
    let {divisions, pixelHeight, width} = this.context;
    const {popoverIsOpen, hoveredDivision: division} = this.state;
    const {left, top, color} = this.props;
    if (width == null) { ({
      width
    } = this.props); }

    return h(Box, {
      className: 'edit-overlay',
      width,
      height: pixelHeight,
      style: {
        left,
        top,
        position: 'absolute',
        zIndex: 18,
        pointerEvents: 'all',
        cursor: 'pointer'
      },
      onClick: this.onEditInterval,
      onMouseEnter: this.onHoverInterval,
      onMouseMove: this.onHoverInterval,
      onMouseLeave: () => {
        if (popoverIsOpen) { return; }
        this.setState({height: null});
        return this.timeout = setTimeout(this.removeHoverBox, 1000);
      }
    }, [
      this.renderHoveredBox(),
      h(EditingBox, {
        division: this.props.editingInterval, color}),
      this.renderCursorLine()
    ]);
  }
}
DivisionEditOverlay.initClass();


export {DivisionEditOverlay};
