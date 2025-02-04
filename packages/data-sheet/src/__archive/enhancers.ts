import ReactDataSheet from "react-datasheet";
//import classNames from "classnames";
interface GridElement extends ReactDataSheet.Cell<GridElement, number> {
  value: number | null;
}

type SheetContent = GridElement[][];

export interface Field<Key> {
  name: string;
  key: Key;
  required?: boolean;
  isValid?(k: any): boolean;
  transform?(k: any): any;
  valueViewer?: (k: any) => any;
  dataEditor?: ReactDataSheet.DataEditor<ReactDataSheet.Cell<any, any>>;
}

export function getFieldData<K>(field: Field<K>): Field<K> {
  const {
    transform = (d) => parseFloat(d),
    isValid = (d) => !isNaN(d),
    required = true,
    ...rest
  } = field;
  return { ...rest, transform, isValid, required };
}

export function enhanceData(row: GridElement[], fields): any[] {
  if (row == null) return [];
  return row.map((cellData, i) => {
    const { dataEditor, valueViewer, key } = getFieldData(fields[i]);

    return { dataEditor, valueViewer, ...cellData };
  });
}
