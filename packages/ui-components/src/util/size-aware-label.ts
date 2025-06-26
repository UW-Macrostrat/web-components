import h from "@macrostrat/hyper";
import { useRef, useEffect, useState } from "react";

export interface Clickable {
  onClick?: (evt: MouseEvent) => void;
}

interface ElementSize {
  width: number;
  height: number;
}

function refSize(ref: React.RefObject<HTMLElement>): ElementSize {
  const { width, height } = ref.current?.getBoundingClientRect();
  return { width, height };
}

export type SizeAwareLabelProps = React.HTMLProps<"div"> &
  Clickable & {
    label: React.ReactNode;
    labelClassName: string;
    isShown?: boolean;
    onClick?: (evt: MouseEvent) => void;
    onVisibilityChanged?(
      fits: boolean,
      containerSize: ElementSize,
      labelSize: ElementSize,
    ): void;
  };

function SizeAwareLabel(props: SizeAwareLabelProps) {
  /** A label that only renders if it fits within its container div.
   * This helps build unit and interval labels that do sensible things
   * when the container is too small.
   *
   * You can use the onUpdate and isShown props to make this a "controlled"
   * component, or you can use the internally managed state. `onUpdate` can
   * be used by itself when you need to report back whether the label was
   * rendered or not (e.g., so you can render it in another location).
   */
  const {
    label,
    isShown,
    onVisibilityChanged,
    className,
    labelClassName,
    onClick,
    ...rest
  } = props;
  const containerRef = useRef<HTMLElement>();
  const labelRef = useRef<HTMLElement>();
  const [fits, setFits] = useState<boolean | null>(null);
  useEffect(() => {
    const containerSz = refSize(containerRef);
    const labelSz = refSize(labelRef);
    const doesFit =
      labelSz.width <= containerSz.width &&
      labelSz.height <= containerSz.height;
    setFits(doesFit);
  }, [containerRef, labelRef, label]);

  // Report whether label fits upwards, if needed
  useEffect(() => {
    if (fits == null) return;
    onVisibilityChanged?.(fits, refSize(containerRef), refSize(labelRef));
  }, [fits]);

  const shouldShow = isShown ?? fits ?? true;

  return h(
    "div.label-container",
    { ...rest, className, ref: containerRef, onClick },
    h(
      "span.label",
      {
        className: labelClassName,
        ref: labelRef,
        style: { visibility: shouldShow ? "visible" : "hidden" },
      },
      h("span.label-text", null, label),
    ),
  );
}

export { SizeAwareLabel };
