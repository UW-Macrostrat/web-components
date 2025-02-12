import { createContext, ReactNode, useContext, useEffect, useRef } from "react";
import h from "@macrostrat/hyper";
import { geologyPatternURL, useAsyncEffect } from "@macrostrat/ui-components";

interface IGeologicPatternBase {
  prefix: string;
  color?: string;
  id: string;
  width: number;
  height: number;
  backgroundColor?: string;
  name?: string;
}

interface IGeologicPatternProvider {
  resolvePattern(string): string;
  children?: ReactNode;
}

const GeologicPatternContext = createContext<any>(null);

const GeologicPatternProvider = (props: IGeologicPatternProvider) => {
  const { resolvePattern, children } = props;
  return h(GeologicPatternContext.Provider, {
    value: { resolvePattern },
    children,
  });
};

enum PatternType {
  Vector = "vector",
  Raster = "raster",
}

const RasterGeologicPattern = (props: IGeologicPatternBase) => {
  const { resolvePattern } = useContext(GeologicPatternContext);
  let { prefix, backgroundColor, color, width, height, id, name, ...rest } =
    props;
  const patternSize = { width, height };
  const patternBounds = { x: 0, y: 0, ...patternSize };

  const patternID = `${prefix}-${name ?? id}`;
  const maskID = `${patternID}-mask`;

  const ref = useRef<HTMLImageElement>();

  useAsyncEffect(async () => {
    const { current: img } = ref;
    if (img == null) return;
    try {
      const uri = await geologyPatternURL(id, backgroundColor, color);
      img.crossOrigin = "anonymous";
      img.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", uri);
    } catch (err) {
      console.error(err);
    }
  }, [id, ref]);

  return h(
    "pattern",
    {
      id: patternID,
      patternUnits: "userSpaceOnUse",
      ...patternSize,
      ...rest,
    },
    h("image", { ref, ...patternSize })
  );
};

const VectorGeologicPattern = (props: IGeologicPatternBase) => {
  const { resolvePattern } = useContext(GeologicPatternContext) ?? {};
  if (resolvePattern == null) return null;
  let {
    prefix,
    backgroundColor,
    color,
    width = 100,
    height = 100,
    id,
    name,
    ...rest
  } = props;
  const patternSize = { width, height };
  const patternBounds = { x: 0, y: 0, ...patternSize };
  const href = resolvePattern(id);

  if (href == null) {
    return null;
  }

  // Compositing if we want to set overlay color
  // let overlayStyles = {}
  // if (color != null) {
  //   overlayStyles = {mixB}
  // }

  const patternID = `${prefix}-${name ?? id}`;
  const maskID = `${patternID}-mask`;

  return h(
    "pattern",
    {
      id: patternID,
      patternUnits: "userSpaceOnUse",
      shapeRendering: "crispEdges",
      ...patternSize,
      ...rest,
    },
    [
      h("g", { style: { isolation: "isolate" } }, [
        // Mask, if required
        h.if(color != null && id != null)("mask", { id: maskID }, [
          h("image", {
            xlinkHref: href,
            ...patternBounds,
          }),
        ]),
        h.if(backgroundColor != null)("rect", {
          ...patternBounds,
          fill: backgroundColor,
        }),
        // Render a masked colored image
        h.if(color != null)("rect", {
          ...patternBounds,
          fill: color,
          mask: `url(#${maskID})`,
        }),
        // Or render the image as normal
        h.if(id != null && color == null)("image", {
          xlinkHref: href,
          ...patternBounds,
        }),
      ]),
    ]
  );
};

interface IGeologicPattern extends IGeologicPatternBase {
  type?: PatternType;
  invert?: boolean;
}

const GeologicPattern = (props: IGeologicPattern) => {
  let { type = PatternType.Vector, invert, ...rest } = props;

  if (invert ?? false) {
    rest.color = props.backgroundColor;
    rest.backgroundColor = props.color;
  }

  switch (type) {
    case PatternType.Vector:
      return h(VectorGeologicPattern, rest);
    case PatternType.Raster:
      return h(RasterGeologicPattern, rest);
  }
};

export {
  GeologicPattern,
  GeologicPatternProvider,
  GeologicPatternContext,
  PatternType,
};
