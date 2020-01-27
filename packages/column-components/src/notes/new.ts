/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {useState, useContext} from 'react';
import h from '../hyper';
import {NoteLayoutContext, NoteRect} from './layout';
import {ModelEditorContext} from '../context';
import {NoteEditorContext} from './editor';
import {HeightRangeAnnotation} from './height-range';
import T from 'prop-types';
import NoteDefs from './defs';

const getHeights = function(position, tolerance=0.1){
  let {startHeight, dragHeight, ...rest} = position;
  if (dragHeight == null) { dragHeight = startHeight; }
  const rng = [startHeight, dragHeight];
  Array.sort(rng);
  let [height, top_height] = rng;
  if ((top_height-height) < tolerance) {
    top_height = null;
  }
  return {height, top_height, ...rest};
};

const HeightRange = function(props){
  let {position, tolerance} = props;
  if (!position) { return null; }
  if (tolerance == null) { tolerance = 0.1; }
  const val = getHeights(position, tolerance);
  return h(HeightRangeAnnotation, val);
};

const NewNotePositioner = function(props){
  const {paddingLeft, scale} = useContext(NoteLayoutContext);
  const {onCreateNote} = useContext(NoteEditorContext);
  if (onCreateNote == null) { return null; }
  const {tolerance} = props;
  const [notePosition, setPosition] = useState(null);
  const {model} = useContext(ModelEditorContext);
  if (model != null) { return null; }

  const eventHeight = evt => scale.invert(evt.nativeEvent.offsetY);

  return h('g.new-note', [
    h(NoteDefs, {fill: 'dodgerblue', sz: 4, prefix: 'new_'}),
    h(NoteRect, {
      width: paddingLeft,
      fill: 'transparent',
      padding: 0,
      style: {cursor: 'drag'},
      onMouseDown(evt){
        if (notePosition != null) { return; }
        return setPosition({
          startHeight: eventHeight(evt),
          offsetX: evt.nativeEvent.offsetX
        });
      },
      onMouseMove(evt){
        if (notePosition == null) { return; }
        return setPosition({
          ...notePosition,
          dragHeight: eventHeight(evt)
        });
      },

      onMouseUp(evt){
        const dragHeight = eventHeight(evt);
        const finalPos = getHeights({...notePosition, dragHeight});
        setPosition(null);
        return onCreateNote(finalPos);
      }
    }),
    h(HeightRange, {position: notePosition})
  ]);
};

NewNotePositioner.defaultProps = {
  tolerance: 0.1
};

export {NewNotePositioner};
