export interface NoteData {
  height: number;
  note: string;
  top_height?: number;
  symbol?: string;
  id?: string | number;
  /** Color for this note's connector and endpoint, as `--note-color` */
  color?: string;
}
