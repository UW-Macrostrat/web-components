import { useEffect } from "react";

const useAsyncEffect = function(fn, dependencies) {
  const vfn = function() {
    fn();
  };
  return useEffect(vfn, dependencies);
};

export { useAsyncEffect };
