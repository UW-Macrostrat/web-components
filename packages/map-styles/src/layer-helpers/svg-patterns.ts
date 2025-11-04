export async function renderTexturesPattern(
  spec: any,
  options?: RasterizeSVGOptions,
) {
  /** Render pattern defined by a riccardoscalco/textures spec to ImageData */
  // Create SVG and render pattern

  const d3Sel = await import("d3-selection");

  const sel = d3Sel.select(document.body);

  const svg = sel.append("svg");

  svg.call(spec);

  const pattern = svg.select("pattern");
  const width = pattern.attr("width");
  const height = pattern.attr("height");

  svg.attr("width", width);
  svg.attr("height", height);

  // Apply the pattern to a rectangle
  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", spec.url());

  const el = svg.node();

  const data = await rasterizeSVG(el, options);

  svg.remove();

  return data;
}

// From https://observablehq.com/@mbostock/saving-svg
const xmlns = "http://www.w3.org/2000/xmlns/";
const xlinkns = "http://www.w3.org/1999/xlink";
const svgns = "http://www.w3.org/2000/svg";

function serializeSVG(svg: SVGElement) {
  svg = svg.cloneNode(true);
  const fragment = window.location.href + "#";
  const walker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    for (const attr of walker.currentNode.attributes) {
      if (attr.value.includes(fragment)) {
        attr.value = attr.value.replace(fragment, "#");
      }
    }
  }
  svg.setAttributeNS(xmlns, "xmlns", svgns);
  svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);
  const serializer = new window.XMLSerializer();
  const string = serializer.serializeToString(svg);
  return new Blob([string], { type: "image/svg+xml" });
}

export interface RasterizeSVGOptions {
  pixelRatio?: number;
}

async function rasterizeSVG(
  svg: SVGElement,
  options?: RasterizeSVGOptions,
): Promise<ImageData> {
  const pixelScale = options?.pixelRatio ?? 4;
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const image = new Image();
    image.onerror = reject;
    image.onload = () => {
      const rect = svg.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        image,
        0,
        0,
        rect.width * pixelScale,
        rect.height * pixelScale,
      );
      const data = ctx.getImageData(
        0,
        0,
        rect.width * pixelScale,
        rect.height * pixelScale,
      );
      resolve(data);
    };
    image.src = URL.createObjectURL(serializeSVG(svg));
  });
}
