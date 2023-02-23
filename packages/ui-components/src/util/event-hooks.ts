import { useEffect, useCallback } from "react";

export function useKeyHandler(
  handler: (event: KeyboardEvent) => void,
  options:
    | { event?: string; keys?: string[]; target?: HTMLElement }
    | any[] = undefined,
  deps: any[] | undefined = undefined
) {
  if (Array.isArray(options)) {
    deps = options;
    options = {};
  }
  const { event = "keydown", keys = [], target = document } = options;
  const _callback = useCallback(
    (event: KeyboardEvent) => {
      if (keys.length === 0 || keys.includes(event.key)) {
        handler(event);
      }
    },
    [handler, keys]
  );

  return useEventHandler(target, event, _callback, deps);
}

export function useEventHandler(
  target: HTMLElement | Document,
  event: string,
  handler: (event: Event) => void,
  deps: any[] | undefined = undefined
) {
  const _callback = deps ? useCallback(handler, deps) : handler;

  useEffect(() => {
    const handleEvent = (event: Event) => {
      _callback(event);
    };

    target.addEventListener(event, handleEvent);
    return () => {
      target.removeEventListener(event, handleEvent);
    };
  }, [_callback, event, target]);
}
