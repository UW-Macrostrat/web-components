import {
  useLayoutEffect,
  useEffect,
  useState,
  useCallback,
  RefObject,
} from "react";

const useAsyncEffect = function (fn, dependencies) {
  const vfn = function () {
    fn();
  };
  return useEffect(vfn, dependencies);
};

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
    console.log(ref);
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
  }, [sizeCallback]);

  return size;
}

function useScrollOffset(ref: RefObject<HTMLElement>): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    ref.current?.addEventListener("scroll", (evt) => {
      const el = <HTMLElement>evt.target;
      setOffset(el.scrollTop);
    });
  }, [ref.current]);
  return offset;
}

export { useElementSize, useScrollOffset, useAsyncEffect };
