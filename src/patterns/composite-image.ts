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
    img.addEventListener("error", err => reject(err));
    img.src = url;
  });
}

function recolorPatternImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  backgroundColor: string,
  color: string
) {
  // create hidden canvas
  ctx.drawImage(img, 0, 0, img.width, img.height);

  //ctx.fillStyle = imgColor;
  //ctx.fillRect(0, 0, 40, 40);

  // overlay using source-atop to follow transparency
  ctx.globalCompositeOperation = "source-in";
  //ctx.globalAlpha = 0.3;
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, img.width, img.height);

  ctx.globalCompositeOperation = "destination-over";

  //const map = ctx.getImageData(0, 0, img.width, img.height);

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, img.width, img.height);

  //ctx.putImageData(map, 0, 0);

  // replace image source with canvas data
  return ctx;
}

function createSolidColorImage(ctx, imgColor) {
  var ctx = canvas.getContext("2d");

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = imgColor;
  ctx.fillRect(0, 0, 40, 40);
  return ctx;
  //return ctx.getImageData(0, 0, 40, 40);
}

enum OutputFormat {
  HTMLImage,
  Base64
}

async function createPatternImage(
  spec: PatternFillSpec,
  outputFormat = OutputFormat.HTMLImage
): Promise<ImageData | string> {
  let ctx;
  var canvas = document.createElement("canvas");
  if (spec.patternURL == null) {
    canvas.width = 40;
    canvas.height = 40;
    ctx = createSolidColorImage(canvas.getContext("2d"), spec.color);
  } else {
    const img = await loadImage(spec.patternURL);
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx = canvas.getContext("2d");
    ctx = recolorPatternImage(
      ctx,
      img,
      spec.color,
      spec.patternColor ?? "#000000"
    );
  }
  switch (outputFormat) {
    case OutputFormat.HTMLImage:
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    case OutputFormat.Base64:
      return canvas.toDataURL();
  }
}

export { recolorPatternImage, createPatternImage, loadImage };
