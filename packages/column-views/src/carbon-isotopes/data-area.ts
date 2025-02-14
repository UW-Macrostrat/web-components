import { line } from "d3-shape";
import { createContext, useContext } from "react";
import h from "@macrostrat/hyper";
import { ColumnLayoutContext } from "@macrostrat/column-components";

const inDomain = (scale, num) => {
  const domain = scale.domain();
  return domain[0] < num < domain[1];
};

const createPointLocator = function (opts) {
  const { xScale, scale, getHeight, ...rest } = opts;
  return function (d, s = 0) {
    const height = getHeight(d);
    if (!inDomain(scale, height)) return null;
    return [xScale(d.value), scale(height)];
  };
};

const IsotopesDataContext = createContext(null);

export interface DataAreaProps {
  clipY: boolean;
  parameter: string;
  corrected: boolean;
  system: string;
  children: React.ReactNode;
  getHeight?: Function;
}

const IsotopesDataArea = function (props: DataAreaProps) {
  const { xScale, scale } = useContext(ColumnLayoutContext) ?? {};

  let { corrected, system, children, getHeight, clipY } = props;
  if (getHeight == null) {
    getHeight = function (d) {
      if (d.height == null) {
        console.log(d);
      }
      return d.height;
    };
  }

  // Handlers for creating points and lines
  const pointLocator = createPointLocator({
    xScale,
    scale,
    corrected,
    system,
    getHeight,
  });

  let column = "avg_" + system;
  if (corrected) {
    column += "_corr";
  }
  const lineLocator = line()
    .x((d) => xScale(d[column]))
    // @ts-ignore
    .y((d) => scale(d.height));

  const value = { pointLocator, lineLocator, corrected, system, clipY };
  return h(IsotopesDataContext.Provider, { value }, h("g.data", children));
};

IsotopesDataArea.defaultProps = { clipY: false };

const IsotopeDataPoint = function (props) {
  const { pointLocator } = useContext(IsotopesDataContext);
  const { datum, strokeWidth, ...rest } = props;
  const loc = pointLocator(datum);
  if (loc == null) return null;
  const [cx, cy] = loc;

  return h("circle", {
    key: datum.sample_id,
    cx,
    cy,
    r: 2,
    ...rest,
  });
};

const IsotopeDataLine = function (props) {
  const { values: lineValues, ...rest } = props;
  const { lineLocator } = useContext(IsotopesDataContext);
  return h("path", {
    d: lineLocator(lineValues),
    fill: "transparent",
    ...rest,
  });
};

const useDataLocator = () => useContext(IsotopesDataContext);

export { IsotopesDataArea, IsotopeDataPoint, IsotopeDataLine, useDataLocator };
