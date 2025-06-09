import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react";
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
  // Overlay to show a gradient between points of variable uncertainty
  const { points, width: _width = 500, height: _height = 500, ...rest } = props;
  const ref = useRef();
  const { width, height } = useElementSize(ref) ?? {};

  return h(
    "div.container",
    {
      style: {
        width: `${_width}px`,
        height: `${_height}px`,
        backgroundColor: "lightgreen",
      },
      ref,
    },
    h(UncertaintyOverlay, { points, width, height, ...rest })
  );
}

function UncertaintyOverlay({
  points,
  width,
  height,
  quantizeSteps = null,
  alphaGradient = false, // If true, use a gradient for the alpha channel
}) {
  // creating a canvas
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null || width == null || height == null) return;
    const imageData = createUncertaintyGradient(points, {
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
  }, [points, width, height]);

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

function createUncertaintyGradient(
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
  let triangulation = null;
  if (seeds.length > 2) {
    triangulation = delaunay(seeds);
  }

  // Check if corners are in the triangulation
  // If not, add them as seeds with negative uncertainty
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  // Weed out corners that are already seeds
  const cornerSet = new Set(seeds.map((s) => s.join(",")));
  const filteredCorners = corners.filter(
    (corner) => !cornerSet.has(corner.join(","))
  );

  const facets = filteredCorners.map((corner) => {
    if (triangulation == null) return null;
    return visibilityWalk(corner, triangulation, seeds);
  });

  // If any corner is not in the triangulation, we need to update the triangulation
  for (let i = 0; i < facets.length; i++) {
    if (facets[i] == null) {
      triangulation = null; // Reset triangulation
      seeds.push(filteredCorners[i]);
      uncertaintyValues.push(-1); // Negative uncertainty for corners
    }
  }

  // If necessary, recreate the triangulation with the updated seeds
  triangulation ??= delaunay(seeds);

  // Iterate through pixels and assign uncertainty values based on barycentric coordinates
  const pixelValues = new Float32Array(width * height);
  let lastFacet = null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Find the triangle that contains the pixel
      const facet = visibilityWalk([x, y], triangulation, seeds, lastFacet);
      if (facet == null) {
        // If no triangle is found, skip this pixel
        pixelValues[y * width + x] = 0; // or some default value
        continue;
      }
      lastFacet = facet; // Update the last facet for the next iteration
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
        n += bary[i];
      }
      // Rescale if we had edge points
      if (n < 1) {
        weightedUncertainty *= 1 / n;
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

export const BlackAndWhite = {
  args: {
    points: basicPoints,
    alphaGradient: false,
  },
};

export const Simple = {
  args: {
    points: [
      { x: 0, y: 0, uncertainty: 0 },
      { x: 350, y: 500, uncertainty: 1 },
    ] as UncertaintyVertex[],
    quantizeSteps: 20,
    alphaGradient: false,
  },
};

export const Large = {
  args: {
    width: 900,
    height: 300,
    points: [
      { x: 0, y: 0, uncertainty: 0 },
      { x: 450, y: 300, uncertainty: 1 },
    ] as UncertaintyVertex[],
    quantizeSteps: 20,
  },
};
