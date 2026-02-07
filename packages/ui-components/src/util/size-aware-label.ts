import h from "@macrostrat/hyper";
import { useRef, useEffect, useState } from "react";
import classNames from "classnames";

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
    positionTolerance?: number;
    allowRotation?: boolean;
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
    positionTolerance = 0,
    allowRotation = false,
    ...rest
  } = props;
  const containerRef = useRef<HTMLElement>();
  const labelRef = useRef<HTMLElement>();
  const [fits, setFits] = useState<boolean | null>(null);
  const [rotated, setRotated] = useState(false);
  useEffect(() => {
    const containerSz = refSize(containerRef);
    const labelSz = refSize(labelRef);
    let doesFit =
      labelSz.width <= containerSz.width + 2 * positionTolerance &&
      labelSz.height <= containerSz.height + 2 * positionTolerance;
    if (allowRotation) {
      if (!doesFit) {
        // Try rotating the label
        const rotatedLabelSz = {
          width: labelSz.height,
          height: labelSz.width,
        };
        const rotatedFits =
          rotatedLabelSz.width <= containerSz.width + 2 * positionTolerance &&
          rotatedLabelSz.height <= containerSz.height + 2 * positionTolerance;
        if (rotatedFits) {
          doesFit = true;
          setRotated(true);
        } else {
          setRotated(false);
        }
      }
    }
    console.log("Label fit check:", {
      label,
      containerSz,
      labelSz,
      doesFit,
      rotated,
    });
    setFits(doesFit);
  }, [containerRef, labelRef, label, positionTolerance, allowRotation]);

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
        className: classNames(labelClassName, { rotated }),
        ref: labelRef,
        style: {
          visibility: shouldShow ? "visible" : "hidden",
        },
      },
      h(
        "span.label-text",
        {
          style: {
            transform: rotated ? "rotate(-90deg)" : undefined,
          },
        },
        label,
      ),
    ),
  );
}

export { SizeAwareLabel };
