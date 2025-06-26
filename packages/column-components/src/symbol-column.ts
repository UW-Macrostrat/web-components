import { Component, useContext } from "react";
import h from "@macrostrat/hyper";
import classNames from "classnames";
import {
  ColumnContext,
  AssetPathContext,
  ColumnCtx,
  ColumnDivision,
  AssetPathCtx,
} from "./context";
import { UUIDComponent } from "./frame";

const symbolIndex = {
  "Hummocky cross-stratified": "hcs.svg",
  "Trough cross-stratified": "tcs.svg",
  "Dessication cracks": "dessication-cracks.svg",
  Ooids: "ooids.svg",
  "Domal stromatolites": "domal-stromatolites.svg",
  "Digitate stromatolites": "digitate-stromatolites.svg",
};

const Symbol = function (props) {
  const { symbol, width, height, UUID } = props;
  const { resolveSymbol } = useContext(AssetPathContext);
  const id = `${UUID}-${symbol}`;
  const symbolSize = { width };
  const href = resolveSymbol(symbolIndex[symbol]);

  return h(
    "symbol",
    {
      id,
      key: id,
      ...symbolSize,
    },
    [
      h("image", {
        href,
        x: 0,
        y: 0,
        ...symbolSize,
      }),
    ],
  );
};

const SymbolDefs = function (props) {
  const { patterns, ...rest } = props;
  const ids = [];
  return h(
    "defs",
    patterns.map(function (sym) {
      const { symbol } = sym;
      if (ids.includes(symbol)) {
        return null;
      }
      ids.push(symbol);
      return h(Symbol, { symbol, ...rest });
    }),
  );
};

interface SymbolColumnProps {
  width: number;
  left: number;
  symbols: any[];
}

export class SymbolColumn extends UUIDComponent<SymbolColumnProps> {
  constructor(props) {
    super(props);
    this.renderSymbol = this.renderSymbol.bind(this);
  }

  static contextType = ColumnContext;
  context: ColumnCtx<ColumnDivision>;
  static defaultProps = {
    width: 30,
    left: 0,
  };

  render() {
    const { scale, pixelHeight, zoom } = this.context;
    const { left, width } = this.props;
    let { symbols } = this.props;
    const patterns = symbols.filter((x, i, arr) => arr.indexOf(x) === i);

    let transform = null;
    if (left != null) {
      transform = `translate(${left})`;
    }

    symbols = symbols
      .filter((d) => d.symbol_min_zoom < zoom)
      .map(this.renderSymbol);

    const x = 0;
    const y = 0;
    return h("g.symbol-column", { transform }, [
      h(SymbolDefs, { width, patterns, UUID: this.UUID }),
      h("rect.symbol-column-area", { width, height: pixelHeight }),
      h("g.symbols", symbols),
    ]);
  }

  renderSymbol(d) {
    const { scale, pixelHeight } = this.context;
    const { symbol, id, height } = d;
    const className = classNames({ symbol }, "symbol");

    const { width } = this.props;
    const y = scale(height) - width / 2;
    if (y < 0 || y > pixelHeight) return null;

    const href = `#${this.UUID}-${symbol}`;
    return h("use", { className, y, x: 0, width, xlinkHref: href, key: id });
  }
}

export class SymbolLegend extends Component {
  static contextType = AssetPathContext;
  context: AssetPathCtx;

  render() {
    const { resolveSymbol } = this.context;
    const arr = [];
    for (let name in symbolIndex) {
      const symbol = symbolIndex[name];
      const sym = h("div", { key: name }, [
        h("img", { src: resolveSymbol(symbol) }),
        h("span.label", name),
      ]);
      arr.push(sym);
    }

    return h("div.symbol-legend", arr);
  }
}
