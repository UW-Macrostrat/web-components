import { objectWithoutProperties as _objectWithoutProperties, objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import h from 'react-hyperscript';

var HTML, Markdown;

Markdown = function Markdown(_ref) {
  var src = _ref.src,
      rest = _objectWithoutProperties(_ref, ["src"]);

  return h('div', {
    dangerouslySetInnerHTML: _objectSpread2({
      __html: src
    }, rest)
  });
};

HTML = Markdown;

export { HTML, Markdown };
//# sourceMappingURL=text.js.map
