import { Component } from 'react';
import h from 'react-hyperscript';
import { findDOMNode } from 'react-dom';

var ConfinedImage;

ConfinedImage = class ConfinedImage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imageSize: null
    };
  }

  render() {
    var imageSize, imgStyle, maxHeight, maxWidth, src, style;
    ({maxHeight, maxWidth, src} = this.props);
    ({imageSize} = this.state);
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
    imgStyle = {maxHeight, maxWidth};
    style = {maxHeight, maxWidth};
    return h('div.image-container', {style}, [
      h('img',
      {
        src,
        style: imgStyle
      })
    ]);
  }

  componentDidMount() {
    var el, img;
    el = findDOMNode(this);
    img = el.querySelector('img');
    return img.onload = () => {
      var height, width;
      height = img.naturalHeight / 2;
      width = img.naturalWidth / 2;
      return this.setState({
        imageSize: {height, width}
      });
    };
  }

};

export { ConfinedImage };
