import { format } from "d3-format";

export const fmt4 = format(".4~f");
export const fmt3 = format(".3~f");
export const fmt2 = format(".2~f");
export const fmt1 = format(".1~f");
export const fmtInt = format(".0f");

export function formatValue(val: number, precision: number = 0): string {
  switch (precision) {
    case 4:
      return fmt4(val);
    case 3:
      return fmt3(val);
    case 2:
      return fmt2(val);
    case 1:
      return fmt1(val);
    case 0:
      return fmtInt(val);
    default:
      return fmt4(val);
  }
}
