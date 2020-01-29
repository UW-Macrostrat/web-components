import { inherits as _inherits, createClass as _createClass, classCallCheck as _classCallCheck, possibleConstructorReturn as _possibleConstructorReturn, getPrototypeOf as _getPrototypeOf } from '../_virtual/_rollupPluginBabelHelpers.js';
import { Component } from 'react';
import h from 'react-hyperscript';
import { findDOMNode } from 'react-dom';

var ConfinedImage;

ConfinedImage =
/*#__PURE__*/
function (_Component) {
  _inherits(ConfinedImage, _Component);

  function ConfinedImage(props) {
    var _this;

    _classCallCheck(this, ConfinedImage);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ConfinedImage).call(this, props));
    _this.state = {
      imageSize: null
    };
    return _this;
  }

  _createClass(ConfinedImage, [{
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
      el = findDOMNode(this);
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
}(Component);

export { ConfinedImage };
//# sourceMappingURL=image.js.map
