import classNames from "classnames";
import hyper from "@macrostrat/hyper";
import styles from "./index.module.sass";

const h = hyper.styled(styles);

export function DataField({
  label,
  value,
  inline = true,
  showIfEmpty = false,
  className,
  children,
  unit,
}: {
  label?: string;
  value?: any;
  inline?: boolean;
  showIfEmpty?: boolean;
  className?: string;
  children?: any;
  unit?: string;
}) {
  if (!showIfEmpty && (value == null || value === "") && children == null) {
    return null;
  }

  return h("div.data-field", { className: classNames(className, { inline }) }, [
    h("div.label", label),
    h("div.data-container", [
      h.if(value != null)(ValueContainer, { value, unit }),
      children,
    ]),
  ]);
}

export function ValueContainer({
  value,
  unit,
  children,
}: {
  value?: any;
  unit?: string;
  children?: any;
}) {
  /** A component for displaying a value with an optional unit
   *
   * @param value The value to display
   * @param unit The unit to display
   * */
  const val = value ?? children;
  return h("span.value-container", [
    h("span.value", val),
    h.if(unit != null)([" ", h("span.unit", unit)]),
  ]);
}
