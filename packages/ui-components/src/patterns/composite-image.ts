interface PatternFillSpec {
  color: string;
  patternURL?: string;
  patternColor?: string;
}

function loadImage(url): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.src = url;
  });
}

function recolorPatternImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  backgroundColor: string,
  color: string,
  backgroundAlpha = 1,
  alpha = 1,
) {
  // create hidden canvas
  ctx.drawImage(img, 0, 0, img.width, img.height);

  //ctx.fillStyle = imgColor;
  //ctx.fillRect(0, 0, 40, 40);

  // overlay using source-atop to follow transparency
  ctx.globalCompositeOperation = "source-in";
  //ctx.globalAlpha = 0.3;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, img.width, img.height);

  ctx.globalCompositeOperation = "destination-over";

  //const map = ctx.getImageData(0, 0, img.width, img.height);

  ctx.globalAlpha = backgroundAlpha;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, img.width, img.height);

  //ctx.putImageData(map, 0, 0);

  // replace image source with canvas data
  return ctx;
}

function createSolidColorImage(ctx, imgColor, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = imgColor;
  ctx.fillRect(0, 0, 40, 40);
  return ctx;
  //return ctx.getImageData(0, 0, 40, 40);
}

enum ImageDataFormat {
  HTMLImageData = "image-data",
  Base64 = "base64",
}

async function createPatternImage(
  spec: PatternFillSpec,
  outputFormat = ImageDataFormat.HTMLImageData,
): Promise<ImageData | string> {
  let ctx;
  var canvas = document.createElement("canvas");
  if (spec.patternURL == null) {
    canvas.width = 40;
    canvas.height = 40;
    ctx = createSolidColorImage(
      canvas.getContext("2d"),
      spec.color ?? spec.patternColor,
    );
  } else {
    const img = await loadImage(spec.patternURL);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx = canvas.getContext("2d");
    ctx = recolorPatternImage(
      ctx,
      img,
      spec.color,
      spec.patternColor ?? "#000000",
    );
  }
  switch (outputFormat) {
    case ImageDataFormat.HTMLImageData:
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    case ImageDataFormat.Base64:
      return canvas.toDataURL();
  }
}

export { recolorPatternImage, createPatternImage, loadImage, ImageDataFormat };
