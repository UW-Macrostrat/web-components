import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react";
import * as natninter from "natninter";
import { useEffect, useRef } from "react";
import { useElementSize } from "@macrostrat/ui-components";
import {
  barycentricCoords,
  delaunay,
  visibilityWalk,
} from "@derschmale/tympanum";

interface UncertaintyVertex {
  x: number;
  y: number;
  uncertainty: number; // Uncertainty value for the vertex
  // 0 would be a fully transparent vertex, 1 would be fully opaque
}

function UncertaintyGradientExample(props) {
  // Overlay to show a a gradient between points of variable uncertainty
  const { points, ...rest } = props;
  const ref = useRef();
  const { width, height } = useElementSize(ref) ?? {};

  return h(
    "div.container",
    {
      style: {
        width: "500px",
        height: "500px",
        backgroundColor: "lightgreen",
      },
      ref,
    },
    h(UncertaintyOverlay, { points, width: 500, height: 500, ...rest })
  );
}

function UncertaintyOverlay({
  points,
  width,
  height,
  interpolator = createUncertaintyGradientVoronoi,
  quantizeSteps = null,
  alphaGradient = false, // If true, use a gradient for the alpha channel
}) {
  // creating a canvas
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null || width == null || height == null) return;
    const imageData = interpolator(points, {
      width,
      height,
    });

    const ctx = canvas.getContext("2d");
    canvas.width = imageData._metadata.width;
    canvas.height = imageData._metadata.height;

    const _width = imageData._metadata.width;
    const _height = imageData._metadata.height;

    const canvasImageData = ctx.getImageData(0, 0, _width, _height);
    const canvasImageDataArray = canvasImageData.data;

    for (var i = 0; i < imageData._data.length; i++) {
      const index1D = i * 4;
      let val = imageData._data[i];
      if (quantizeSteps != null) {
        val = Math.floor(val / quantizeSteps) * quantizeSteps;
      }
      //var val = Math.floor(imageData._data[i] / 10) * 10;
      let alphaVal = 255;
      if (alphaGradient) {
        alphaVal = val;
        val = 255; // Set color to white
      }

      canvasImageDataArray[index1D] = val;
      canvasImageDataArray[index1D + 1] = val;
      canvasImageDataArray[index1D + 2] = val;
      canvasImageDataArray[index1D + 3] = alphaVal;
    }

    ctx.putImageData(canvasImageData, 0, 0);
  }, [points, width, height, interpolator]);

  return h("canvas", {
    style: { imageRendering: "pixelated", width, height },
    ref: canvasRef,
  });
}

interface GradientOutput {
  _data: Float32Array;
  _metadata: {
    width: number;
    height: number;
  };
}

interface UncertaityGradientOptions {
  width: number;
  height: number;
}

function createUncertaintyGradientVoronoi(
  points: UncertaintyVertex[],
  options: UncertaityGradientOptions | null
): GradientOutput {
  const { width, height } = options ?? {};
  const seeds = points.map(({ x, y, uncertainty }) => {
    return [x, y];
    //return Float32Array.from([x, y]);
  });

  // Put seeds at all image corners, with negative uncertainty
  // Note: we should only do this when corners are outside of the convex hull of the points.

  // seeds.push([0, 0]);
  // seeds.push([width - 1, 0]);
  // seeds.push([0, height - 1]);
  // seeds.push([width - 1, height - 1]);

  const uncertaintyValues = points.map(({ uncertainty }) => {
    // Normalize uncertainty to a value between 0 and 255
    return uncertainty;
  });

  //uncertaintyValues.push(-1, -1, -1, -1); // Negative uncertainty for corners

  // Create a Delaunay triangulation from the points
  const triangulation = delaunay(seeds);

  // Iterate through pixels and assign uncertainty values based on barycentric coordinates
  const pixelValues = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Find the triangle that contains the pixel
      const facet = visibilityWalk([x, y], triangulation, seeds);
      if (facet == null) {
        // If no triangle is found, skip this pixel
        pixelValues[y * width + x] = 0; // or some default value
        continue;
      }
      // Get the triangle index from the facet
      const bary = barycentricCoords([x, y], facet, seeds);

      let weightedUncertainty = 0;

      let n = 0;
      for (let i = 0; i < bary.length; ++i) {
        // get the index of the point
        let index = facet.verts[i];

        // get the color at that index
        let c = uncertaintyValues[index];
        if (c == -1) {
          continue;
        }
        weightedUncertainty += bary[i] * c;
        n += 1;
      }
      // Rescale if we had edge points
      if (n < 3) {
        weightedUncertainty *= 3 / n;
      }
      pixelValues[y * width + x] = weightedUncertainty * 255; // Scale to 0-255 range
    }
  }

  return {
    _data: pixelValues,
    _metadata: {
      width: width,
      height: height,
    },
  };
}

function createUncertaintyGradientNatural(
  points: UncertaintyVertex[],
  options: UncertaityGradientOptions | null
): GradientOutput {
  const { width, height } = options ?? {};
  const seeds = points.map(({ x, y, uncertainty }) => {
    return {
      x,
      y,
      value: uncertainty * 255,
    };
  });

  // Creating the nni interpolator instance
  const nnInter = new natninter.Interpolator();

  // setting the output size
  nnInter.setOutputSize(width, height);

  // add a list of seeds
  nnInter.addSeeds(seeds);

  // Create the interpolation map
  // (this may take some seconds, start with a small image to benchmark it)
  nnInter.generateMap();

  // generate the output image witha  nice interpolation
  return nnInter.generateImage();
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Cross sections/Uncertainty gradient",
  component: UncertaintyGradientExample,
  description: "Example of an uncertainty gradient",
} as Meta<typeof UncertaintyGradientExample>;

const basicPoints: UncertaintyVertex[] = [
  { x: 0, y: 0, uncertainty: 0 },
  { x: 499, y: 0, uncertainty: 0.2 },
  { x: 0, y: 499, uncertainty: 1 },
  { x: 249, y: 249, uncertainty: 1 },
  { x: 499, y: 499, uncertainty: 1 },
  { x: 499, y: 0, uncertainty: 0.5 },
];

export const Default = {
  args: {
    points: basicPoints,
    quantizeSteps: 20,
    alphaGradient: true,
  },
};

export const NaturalInterpolation = {
  args: {
    points: basicPoints,
    interpolator: createUncertaintyGradientNatural,
    quantizeSteps: 20,
    alphaGradient: true,
  },
};
