/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { createContext } from "react";
import h from "react-hyperscript";
import T from "prop-types";

const AssetPathContext = createContext({
  resolveSymbol() {}
});

const AssetPathProvider = function(props) {
  const { children, resolveSymbol } = props;
  return h(
    AssetPathContext.Provider,
    {
      value: { resolveSymbol }
    },
    children
  );
};

AssetPathProvider.propTypes = {
  resolveSymbol: T.func.isRequired
};

export { AssetPathContext, AssetPathProvider };
