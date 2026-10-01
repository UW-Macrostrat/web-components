import { useEffect, useLayoutEffect } from "react";

/** `useLayoutEffect` in the browser, so measurements land before paint;
 * `useEffect` on the server, where layout effects warn and never run. */
export const useIsomorphicLayoutEffect =
  typeof window == "undefined" ? useEffect : useLayoutEffect;
