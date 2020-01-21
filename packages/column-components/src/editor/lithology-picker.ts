/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component, createElement, useContext} from "react";
import hyper from "@macrostrat/hyper";
import Select from 'react-select';

import {symbolIndex} from "../lithology";
import {GeologicPatternContext} from '../lithology';
import {LithologyContext} from "../context";

import styles from './main.styl';

const h = hyper.styled(styles);

const LithologySwatch = function({symbolID, style, ...rest}){
  const {resolvePattern} = useContext(GeologicPatternContext);
  const src = resolvePattern(symbolID);
  if (style == null) { style = {}; }
  style.backgroundImage = `url(\"${src}\")`;
  return h('div.lithology-swatch', {style, ...rest});
};

const LithologyItem = function(props){
  const {symbol, lithology} = props;
  return h('span.facies-picker-row', [
    h(LithologySwatch, {symbolID: symbol}),
    h('span.facies-picker-name', lithology)
  ]);
};

class LithologyPicker extends Component {
  static initClass() {
    this.contextType = LithologyContext;
  }
  render() {
    const {interval, onChange} = this.props;

    const {lithologies} = this.context;

    const options = (() => {
      const result = [];
      for (let item of Array.from(lithologies)) {
        const {id, pattern} = item;
        const symbol = symbolIndex[pattern];
        if (symbol == null) { continue; }
        result.push({value: id, label: h(LithologyItem, {lithology: id, symbol})});
      }
      return result;
    })();

    let value = options.find(d => d.value === interval.lithology);
    if (value == null) { value = null; }

    return h(Select, {
      id: 'lithology-select',
      options,
      value,
      isClearable: true,
      onChange(res){
        const f = (res != null) ? res.value : null;
        return onChange(f);
      }
    });
  }
}
LithologyPicker.initClass();


class LithologySymbolPicker extends Component {
  render() {
    let symbol;
    const {interval} = this.props;
    let isUserSet = false;
    console.log(interval);
    let text = "No pattern set";
    if (interval.pattern != null) {
      symbol = interval.pattern;
      isUserSet = true;
      text = `Symbol ${symbol}`;
    }
    if (interval.lithology != null) {
      symbol = symbolIndex[interval.lithology];
      text = "Default for lithology";
    }

    return h('div.lithology-symbol-picker', [
      h.if(symbol != null)(LithologySwatch, {symbolID: symbol}),
      h("div.picker-label.text", text)
    ]);
  }
}

export {LithologyPicker, LithologySymbolPicker};
