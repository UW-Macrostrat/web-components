import { useEffect } from 'react';

var useAsyncEffect;

useAsyncEffect = function useAsyncEffect(fn, dependencies) {
  var vfn;

  vfn = function vfn() {
    fn();
  };

  return useEffect(vfn, dependencies);
};

export { useAsyncEffect };
//# sourceMappingURL=hooks.js.map
