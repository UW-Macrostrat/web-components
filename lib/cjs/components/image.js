'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../_virtual/_rollupPluginBabelHelpers.js');
var react = require('react');
var h = _interopDefault(require('react-hyperscript'));
var reactDom = require('react-dom');

exports.ConfinedImage =
/*#__PURE__*/
function (_Component) {
  __chunk_1.inherits(ConfinedImage, _Component);

  function ConfinedImage(props) {
    var _this;

    __chunk_1.classCallCheck(this, ConfinedImage);

    _this = __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(ConfinedImage).call(this, props));
    _this.state = {
      imageSize: null
    };
    return _this;
  }

  __chunk_1.createClass(ConfinedImage, [{
    key: "render",
    value: function render() {
      var imageSize, imgStyle, maxHeight, maxWidth, src, style;
      var _this$props = this.props;
      maxHeight = _this$props.maxHeight;
      maxWidth = _this$props.maxWidth;
      src = _this$props.src;
      imageSize = this.state.imageSize;

      if (maxHeight == null) {
        maxHeight = 200;
      }

      if (maxWidth == null) {
        maxWidth = 200;
      }

      if (imageSize != null) {
        if (maxHeight > imageSize.height) {
          maxHeight = imageSize.height;
        }

        if (maxWidth > imageSize.width) {
          maxWidth = imageSize.width;
        }
      }

      imgStyle = {
        maxHeight: maxHeight,
        maxWidth: maxWidth
      };
      style = {
        maxHeight: maxHeight,
        maxWidth: maxWidth
      };
      return h('div.image-container', {
        style: style
      }, [h('img', {
        src: src,
        style: imgStyle
      })]);
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      var el, img;
      el = reactDom.findDOMNode(this);
      img = el.querySelector('img');
      return img.onload = function () {
        var height, width;
        height = img.naturalHeight / 2;
        width = img.naturalWidth / 2;
        return _this2.setState({
          imageSize: {
            height: height,
            width: width
          }
        });
      };
    }
  }]);

  return ConfinedImage;
}(react.Component);
//# sourceMappingURL=image.js.map
