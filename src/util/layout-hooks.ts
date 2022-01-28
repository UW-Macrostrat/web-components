import { useAsyncEffect } from "use-async-effect";
import {
  useLayoutEffect,
  useEffect,
  useState,
  useCallback,
  RefObject,
} from "react";

type ElementSize = {
  height: number;
  width: number;
};

type ElementSizeOpts = {
  trackWindowResize?: boolean;
};

function useElementSize(
  ref: RefObject<HTMLElement>,
  opts: ElementSizeOpts = {}
): ElementSize | null {
  /** Also see https://github.com/Swizec/useDimensions */
  const { trackWindowResize = true } = opts;
  const [size, setSize] = useState<ElementSize>(null);

  const sizeCallback = useCallback(() => {
    if (ref.current == null) return;
    const { height, width } = ref.current.getBoundingClientRect();
    setSize({ height, width });
  }, [ref]);

  useLayoutEffect(sizeCallback, [ref]);

  // Also respond on window resize (if "trackWindowResize" is set)
  useEffect(() => {
    if (!trackWindowResize) return;
    window.addEventListener("resize", sizeCallback);
    return function () {
      window.removeEventListener("resize", sizeCallback);
    };
  }, [sizeCallback, trackWindowResize]);

  return size;
}

function useScrollOffset(ref: RefObject<HTMLElement>): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    ref.current?.addEventListener("scroll", (evt) => {
      const el = evt.target as HTMLElement;
      setOffset(el.scrollTop);
    });
  }, [ref.current]);
  return offset;
}

export { useElementSize, useScrollOffset, useAsyncEffect };
