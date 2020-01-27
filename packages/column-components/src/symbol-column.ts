/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {select} from "d3-selection";
import {Component, createElement, useContext} from "react";
import h from "react-hyperscript";
import {join, resolve} from "path";
import classNames from "classnames";
import {path} from "d3-path";
import {ColumnContext, AssetPathContext} from './context';
import {UUIDComponent} from './frame';
import T from 'prop-types';

const symbolIndex = {
  "Hummocky cross-stratified": "hcs.svg",
  "Trough cross-stratified": "tcs.svg",
  "Dessication cracks": "dessication-cracks.svg",
  "Ooids": "ooids.svg",
  "Domal stromatolites": "domal-stromatolites.svg",
  "Digitate stromatolites": "digitate-stromatolites.svg"
};

const Symbol = function(props){
  const {symbol, width, height, UUID} = props;
  const {resolveSymbol} = useContext(AssetPathContext);
  const id = `${UUID}-${symbol}`;
  const symbolSize = {width};
  const href = resolveSymbol(symbolIndex[symbol]);

  return h('symbol', {
    id,
    key: id,
    ...symbolSize
  }, [
    h('image', {
      href,
      x:0,y:0,
      ...symbolSize
    })
  ]);
};

const SymbolDefs = function(props){
  const {patterns, ...rest} = props;
  const ids = [];
  return h('defs', patterns.map(function(sym){
    const {symbol} = sym;
    if (ids.includes(symbol)) { return null; }
    ids.push(symbol);
    return h(Symbol, {symbol, ...rest});}));
};

class SymbolColumn extends UUIDComponent {
  constructor(...args) {
    super(...args);
    this.renderSymbol = this.renderSymbol.bind(this);
  }

  static initClass() {
    this.contextType = ColumnContext;
    this.defaultProps = {
      width: 30,
      left: 0
    };
    this.propTypes = {
      width: T.number,
      left: T.number,
      symbols: T.arrayOf(T.object).isRequired
    };
  }

  render() {
    const {scale, pixelHeight, zoom} = this.context;
    const {left, width} = this.props;
    let {symbols} = this.props;
    const patterns = symbols
      .filter((x, i, arr) => arr.indexOf(x) === i);

    let transform = null;
    if (left != null) {
      transform = `translate(${left})`;
    }

    symbols = symbols
      .filter(d => d.symbol_min_zoom < zoom)
      .map(this.renderSymbol);

    const x = 0;
    const y = 0;
    return h('g.symbol-column', {transform}, [
      h(SymbolDefs, {width, patterns, UUID: this.UUID}),
      h('rect.symbol-column-area', {width, height: pixelHeight}),
      h('g.symbols', symbols)
    ]);
  }

  renderSymbol(d){
    const {scale} = this.context;
    const {symbol, id, height} = d;
    const className = classNames({symbol}, 'symbol');

    const {width} = this.props;
    const y = scale(height)-(width/2);

    const href = `#${this.UUID}-${symbol}`;
    return h("use", {className,y, x: 0, width, xlinkHref: href, key: id});
  }
}
SymbolColumn.initClass();

class SymbolLegend extends Component {
  static initClass() {
    this.contextType = AssetPathContext;
  }
  render() {
    const {resolveSymbol} = this.context;
    const arr = [];
    for (let name in symbolIndex) {
      const symbol = symbolIndex[name];
      const sym =  h('div', {key: name}, [
        h('img', {src: resolveSymbol(symbol)}),
        h('span.label', name)
      ]);
      arr.push(sym);
    }

    return h('div.symbol-legend', arr);
  }
}
SymbolLegend.initClass();

export {SymbolColumn, SymbolLegend};
