'use strict';

var react = require('react');

exports.useAsyncEffect = function useAsyncEffect(fn, dependencies) {
  var vfn;

  vfn = function vfn() {
    fn();
  };

  return react.useEffect(vfn, dependencies);
};
//# sourceMappingURL=hooks.js.map
