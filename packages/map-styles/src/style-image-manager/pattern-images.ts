/** Todo: integrate this with Macrostrat web components */

export async function mapLoadImage(map, url: string) {
  return new Promise((resolve, reject) => {
    map.loadImage(url, function (err, image) {
      // Throw an error if something went wrong
      if (err) {
        console.error(`Could not load image ${url}`);
        reject(err);
      }
      // Declare the image
      resolve(image);
    });
  });
}

export function createTransparentImage() {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = 40;
  canvas.height = 40;
  ctx.globalAlpha = 0;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 40, 40);
  return ctx.getImageData(0, 0, 40, 40);
}
