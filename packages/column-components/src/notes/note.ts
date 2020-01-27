/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {findDOMNode} from "react-dom";
import {Component, createElement, useContext, createRef, forwardRef} from "react";
import h from "../hyper";
import T from "prop-types";
import {NoteLayoutContext} from './layout';
import {NoteEditorContext} from './editor';
import {HeightRangeAnnotation} from './height-range';
import {hasSpan} from './utils';
import {ForeignObject} from '../util';
import {NoteShape} from './types';

const NoteBody = function(props){
  const {note} = props;
  const {setEditingNote, editingNote} = useContext(NoteEditorContext);
  const {noteComponent} = useContext(NoteLayoutContext);
  const isEditing = editingNote === note;

  const onClick = () => setEditingNote(note);

  const visibility = isEditing ? 'hidden' : 'inherit';
  return h(noteComponent, {visibility, note, onClick});
};

const NotePositioner = forwardRef(function(props, ref){
  let {offsetY, noteHeight, children} = props;
  const {width, paddingLeft} = useContext(NoteLayoutContext);
  if (noteHeight == null) { noteHeight = 0; }
  const outerPad = 5;

  let y = offsetY-(noteHeight/2)-outerPad;

  // HACK: override y position for Safari
  // (foreign objects don't work too well)
  if (navigator.userAgent.includes("Safari")) {
    y += 5;
  }

  return h(ForeignObject, {
    width: (width-paddingLeft)+(2*outerPad),
    x: paddingLeft-outerPad,
    y,
    height: noteHeight+(2*outerPad),
    style: {overflowY: 'visible'}
  }, [
    h('div.note-inner', {
      ref,
      style: {margin: outerPad}
    }, children)
  ]);});

const findIndex = function(note){
  const {notes} = useContext(NoteLayoutContext);
  return notes.indexOf(note);
};

const NoteConnector = function(props){
  let {note, node, index} = props;
  // Try to avoid scanning for index if we can
  if (index == null) { index = findIndex(note); }
  const {nodes, columnIndex, generatePath} = useContext(NoteLayoutContext);
  const {height, top_height} = note;

  if (node == null) { node = nodes[note.id]; }
  const offsetX = (columnIndex[index] || 0)*5;

  return h([
    h(HeightRangeAnnotation, {
      offsetX,
      height,
      top_height
    }),
    h('path.link', {
      d: generatePath(node, offsetX),
      transform: `translate(${offsetX})`
    })
  ]);
};

const NoteMain = forwardRef(function(props, ref){
  const {note, offsetY, noteHeight} = props;
  const {editingNote} = useContext(NoteEditorContext);
  if (editingNote === note) { return null; }
  return h("g.note", [
    h(NoteConnector, {note}),
    h(NotePositioner, {
      offsetY,
      noteHeight,
      ref
    }, [
      h(NoteBody, {note})
    ])
  ]);});

class Note extends Component {
  static initClass() {
    this.propTypes = {
      editable: T.bool,
      note: NoteShape.isRequired,
      editHandler: T.func
    };
    this.contextType = NoteLayoutContext;
  }
  constructor(props){
    this.updateHeight = this.updateHeight.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    super(props);
    this.element = createRef();
    this.state = {height: null};
  }

  render() {
    const {style, note, editHandler, editable} = this.props;
    const {scale, nodes, columnIndex, width, paddingLeft} = this.context;

    const node = nodes[note.id];
    let offsetY = scale(note.height);
    if (node != null) {
      offsetY = node.currentPos;
    }

    const noteHeight = (this.state.height || 0);

    return h(NoteMain, {
      offsetY,
      note,
      noteHeight,
      ref: this.element
    });
  }

  updateHeight(prevProps){
    const node = this.element.current;
    if (node == null) { return; }
    const height = node.offsetHeight;
    if (height == null) { return; }
    if ((prevProps != null) && (prevProps.note === this.props.note)) { return; }
    console.log("Updating note height");
    this.setState({height});
    return this.context.registerHeight(this.props.note.id, height);
  }

  componentDidMount() {
    return this.updateHeight.apply(this,arguments);
  }

  componentDidUpdate() {
    return this.updateHeight.apply(this,arguments);
  }
}
Note.initClass();

const NotesList = function(props){
  let {inEditMode: editable, ...rest} = props;
  if (editable == null) { editable = false; }
  const {notes} = useContext(NoteLayoutContext);
  return h('g', notes.map(note=> {
    return h(Note, {key: note.id, note, editable, ...rest});
}));
};

export {Note, NotesList, NotePositioner, NoteConnector};
