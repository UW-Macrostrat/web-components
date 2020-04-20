/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {useEffect} from 'react';

const useAsyncEffect = function(fn,dependencies){
  const vfn = function() {
    fn();
  };
  return useEffect(vfn, dependencies);
};

export {useAsyncEffect};
