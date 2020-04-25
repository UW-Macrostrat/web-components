/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {createContext, useState, useContext} from 'react';
import {ColumnContext, ModelEditorProvider, useModelEditor} from '../context';
import {EditableText} from "@blueprintjs/core";
import classNames from 'classnames';
import h from "../hyper";
import T from 'prop-types';
import {NoteShape} from './types';
import {ForeignObject} from '../util';
import {NoteLayoutContext, NoteRect} from './layout';
import {NotePositioner, NoteConnector} from './connector';
import Draggable from 'react-draggable';
import {hasSpan} from './utils';
import Box from 'ui-box';

const NoteEditorContext = createContext({inEditMode: false});

const NoteTextEditor = function(props){
  const {updateModel} = useModelEditor();
  const {note} = props;
  return h(EditableText, {
    multiline: true,
    className: 'col-note-label note-editing',
    defaultValue: note.note,
    isEditing: true,
    onConfirm(newText){
      return updateModel({note: {$set: newText}});
    }
  });
};

NoteTextEditor.propTypes = {
  note: NoteShape.isRequired
};

const NoteEditorProvider = function(props){
  let {children, inEditMode, noteEditor} = props;
  const {notes} = useContext(NoteLayoutContext);
  if (inEditMode == null) { inEditMode = false; }

  const [editingNote, setState] = useState(null);

  const setEditingNote = val => setState(val);

  const deleteNote = function() {
    const val = editingNote;
    setState(null);
    return props.onDeleteNote(val);
  };

  const onCreateNote = function(pos){
    const {height, top_height} = pos;
    const val = {height, top_height, note: null, symbol: null};
    return setState(val);
  };

  const value = {
    editingNote,
    setEditingNote,
    deleteNote,
    inEditMode,
    noteEditor,
    onCreateNote
  };

  const onConfirmChanges = function(n){
    if (n == null) { return; }
    if (n.note == null) { return; }
    if (n === editingNote) { return; }
    return props.onUpdateNote(n);
  };

  //# Model editor provider gives us a nice store
  return h(NoteEditorContext.Provider, {value}, [
    h(ModelEditorProvider, {
      model: editingNote,
      onDelete: deleteNote,
      onConfirmChanges,
      logUpdates: true,
      alwaysConfirm: true
    }, children)
  ]);
};

NoteEditorProvider.propTypes = {
  inEditMode: T.bool,
  noteEditor: T.elementType.isRequired,
  onUpdateNote: T.func.isRequired,
  onDeleteNote: T.func.isRequired
};

const NoteConnectorPath = function(props){
  const {d, offsetX, className} = props;
  return h('path', {
    d,
    className,
    transform: `translate(${offsetX})`,
    fill: 'transparent'
  });
};


const EditableNoteConnector = function(props){
  const {notes, nodes, columnIndex,
   generatePath,
   createNodeForNote} = useContext(NoteLayoutContext);
  let {note, node, index} = props;
  if (note.id != null) {
    node = nodes[note.id];
  }
  if (node == null) { node = createNodeForNote(note); }
  const x = (columnIndex[note.id]*5) || 0;

  const d = generatePath(node, x);

  return h([
    h(NoteConnectorPath, {
      className: 'note-connector',
      d, offsetX: x
    }),
    h(ForeignObject, {
      width: 30, x, y: 0, height: 1,
      style: {overflowY: 'visible'}
    }, [
      h(PositionEditorInner, {note})
    ])
  ]);
};

const PointHandle = function(props){
  let {height, size, className, ...rest} = props;
  className = classNames('handle point-handle', className);
  if (size == null) { size = 10; }
  return h(Draggable, {
    position: {x: 0, y: height},
    axis: 'y',
    ...rest
  }, [
    h(Box, {
      height: size,
      width: size,
      marginLeft: -size/2,
      marginTop: -size/2,
      position: 'absolute',
      className
    })
  ]);
};

var PositionEditorInner = function(props){
  let updateModel;
  let {note, margin} = props;
  if (margin == null) { margin = 3; }
  const {scaleClamped: scale} = useContext(ColumnContext);
  ({updateModel, editedModel: note} = useModelEditor());
  if (note == null) { return null; }

  const noteHasSpan = hasSpan(note);

  const bottomHeight = scale(note.height);
  let topHeight = bottomHeight;
  let height = 0;
  if (noteHasSpan) {
    topHeight = scale(note.top_height);
    height = Math.abs(topHeight-bottomHeight);
  }

  const moveEntireNote = function(e, data){
    const {y} = data;
    // Set note height
    const spec = {height: {$set: scale.invert(y+height)}};
    if (noteHasSpan) {
      // Set note top height
      spec.top_height = {$set: scale.invert(y)};
    }
    return updateModel(spec);
  };

  const moveTop = function(e, data){
    const spec = {top_height: {$set: scale.invert(data.y)}};
    if (Math.abs(data.y-bottomHeight) < 2) {
      spec.top_height = {$set: null};
    }
    return updateModel(spec);
  };

  const moveBottom = function(e, data){
    const spec = {height: {$set: scale.invert(data.y)}};
    if (Math.abs(data.y-topHeight) < 2) {
      spec.top_height = {$set: null};
    }
    return updateModel(spec);
  };

  return h('div.position-editor', [
    h.if(noteHasSpan)(Draggable, {
      position: {x: 0, y: topHeight},
      onDrag: moveEntireNote,
      axis: 'y'
    }, [
      h(Box, {
        className: 'handle',
        height,
        width: 2*margin,
        marginLeft: -margin, marginTop: -margin, position: 'absolute'}, [
      ])
    ]),
    h(PointHandle, {
      height: noteHasSpan ? topHeight : topHeight-15,
      onDrag: moveTop,
      className: classNames('top-handle', {'add-span-handle': !noteHasSpan}),
      bounds: {bottom: bottomHeight}
    }),
    h(PointHandle, {
      height: bottomHeight,
      onDrag: moveBottom,
      className: 'bottom-handle',
      bounds: noteHasSpan ? {top: topHeight} : null
    })
  ]);
};

const NoteEditorUnderlay = function({padding}){
  const {width} = useContext(NoteLayoutContext);
  const {setEditingNote} = useContext(NoteEditorContext);
  return h(NoteRect, {
    fill: 'rgba(255,255,255,0.8)',
    style: {pointerEvents: 'none'},
    className: 'underlay'
  });
};

const NoteEditor = function(props){
  const {allowPositionEditing} = props;
  const {noteEditor} = useContext(NoteEditorContext);
  const {notes, nodes, elementHeights, createNodeForNote} = useContext(NoteLayoutContext);
  const {editedModel} = useModelEditor();
  if (editedModel == null) { return null; }
  const index = notes.indexOf(editedModel);
  const {id: noteID} = editedModel;
  let node = nodes[noteID] || createNodeForNote(editedModel);
  const noteHeight = elementHeights[noteID] || 20;

  if (editedModel.height != null) {
    const newNode = createNodeForNote(editedModel);
    // Set position of note to current position
    newNode.currentPos = node.currentPos;

    const pos = newNode.centerPos || newNode.idealPos;
    const dy = pos-node.currentPos;
    if (dy > 50) {
      newNode.currentPos = pos-50;
    }
    if (dy < -50) {
      newNode.currentPos = pos+50;
    }
    node = newNode;
  }

  return h('g.note-editor.note', [
    h(NoteEditorUnderlay),
    h.if(!allowPositionEditing)(NoteConnector, {note: editedModel}),
    h.if(allowPositionEditing)(EditableNoteConnector, {note: editedModel, node}),
    h(NotePositioner, {offsetY: node.currentPos, noteHeight}, [
      h(noteEditor, {
        note: editedModel,
        key: index
      })
    ])
  ]);
};

export {
  NoteEditorProvider,
  NoteEditorContext,
  NoteTextEditor,
  NoteEditor
};
