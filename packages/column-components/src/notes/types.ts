import T from "prop-types";

const NoteShape = T.shape({
  height: T.number.isRequired,
  note: T.string,
  top_height: T.number,
  symbol: T.string,
});

interface NoteData {
  height: number;
  note: string;
  top_height?: number;
  symbol?: string;
  id?: string;
}

type Note = NoteData;

export { NoteShape, NoteData, Note };
