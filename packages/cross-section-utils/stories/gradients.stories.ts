import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react";
import * as natninter from "natninter";
import { useEffect, useRef } from "react";
import { useElementSize } from "@macrostrat/ui-components";

interface UncertaintyVertex {
  x: number;
  y: number;
  uncertainty: number; // Uncertainty value for the vertex
  // 0 would be a fully transparent vertex, 1 would be fully opaque
}

function UncertaintyGradientExample(props) {
  // Overlay to show a a gradient between points of variable uncertainty
  const { points } = props;
  const ref = useRef();
  const { width, height } = useElementSize(ref) ?? {};

  return h(
    "div.container",
    {
      style: {
        width: "250px",
        height: "250px",
        backgroundColor: "lightgreen",
      },
      ref,
    },
    h(UncertaintyOverlay, { points, width, height })
  );
}

function UncertaintyOverlay({ points, width, height }) {
  // creating a canvas
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null || width == null || height == null) return;
    const imageData = createUncertaintyGradient(points, { width, height });

    const ctx = canvas.getContext("2d");

    const _width = imageData._metadata.width;
    const _height = imageData._metadata.height;

    const canvasImageData = ctx.getImageData(0, 0, _width, _height);
    const canvasImageDataArray = canvasImageData.data;

    for (var i = 0; i < imageData._data.length; i++) {
      var index1D = i * 4;
      //var val = Math.floor(imageData._data[i]);
      var val = Math.floor(imageData._data[i] / 10) * 10;
      canvasImageDataArray[index1D] = val;
      canvasImageDataArray[index1D + 1] = val;
      canvasImageDataArray[index1D + 2] = val;
      canvasImageDataArray[index1D + 3] = 255;
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

export const Default = {
  args: {
    points: [
      { x: 0, y: 0, uncertainty: 1 },
      //{ x: 499, y: 0, uncertainty: 0 },
      { x: 125, y: 125, uncertainty: 0 },
      //{ x: 0, y: 499, uncertainty: 1 },
      { x: 249, y: 249, uncertainty: 1 },
    ] as UncertaintyVertex[],
  },
};
