import { useEffect, useRef, useState } from "react";
import h from "@macrostrat/hyper";

type ConfinedImageProps = {
  maxHeight?: number | null;
  maxWidth?: number | null;
  src: string;
};

type ConfinedImageSize = {
  width: number;
  height: number;
};

export function ConfinedImage(props: ConfinedImageProps) {
  let { maxHeight, maxWidth, src } = props;
  const [imageSize, setImageSize] = useState<ConfinedImageSize>(null);

  const imgRef = useRef(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img != null) {
      img.onload = () => {
        const height = img.naturalHeight;
        const width = img.naturalWidth;
        setImageSize({ height, width });
      };
    }
  }, [imgRef]);

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
    h("img", { src, ref: imgRef, style: imgStyle }),
  ]);
}
