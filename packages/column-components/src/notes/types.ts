import T from 'prop-types';

const NoteShape = T.shape({
  height: T.number.isRequired,
  note: T.string,
  top_height: T.number,
  symbol: T.string
});

export {NoteShape};
