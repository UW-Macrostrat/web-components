import { Component } from "react";
import { findDOMNode } from "react-dom";
import h from "@macrostrat/hyper";

type ConfinedImageProps = {
  maxHeight?: number | null;
  maxWidth?: number | null;
  src: string;
};

type ConfinedImageState = {
  imageSize?: {
    width: number;
    height: number;
  };
};

class ConfinedImage extends Component<ConfinedImageProps, ConfinedImageState> {
  constructor(props) {
    super(props);
    this.state = { imageSize: null };
  }

  render() {
    let { maxHeight, maxWidth, src } = this.props;
    const { imageSize } = this.state;
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

    const imgStyle = {
      maxHeight,
      maxWidth,
    };

    const style = { maxHeight, maxWidth };
    return h("div.image-container", { style }, [
      h("img", { src, style: imgStyle }),
    ]);
  }

  componentDidMount() {
    const el = findDOMNode(this);
    // @ts-ignore
    const img = el.querySelector("img");
    return (img.onload = () => {
      const height = img.naturalHeight / 2;
      const width = img.naturalWidth / 2;
      return this.setState({ imageSize: { height, width } });
    });
  }
}

export { ConfinedImage };
