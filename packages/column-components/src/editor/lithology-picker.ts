import { useContext, useState } from "react";
import hyper from "@macrostrat/hyper";
import { RaisedSelect } from "./util";
import { Button, Intent } from "@blueprintjs/core";

import { symbolIndex } from "../lithology";
import { GeologicPatternContext } from "../lithology";
import { LithologyContext } from "../context";

import styles from "./main.module.scss";

const h = hyper.styled(styles);

const LithologySwatch = function ({ symbolID, style, ...rest }) {
  const { resolvePattern } = useContext(GeologicPatternContext);
  const src = resolvePattern(symbolID);
  if (style == null) {
    style = {};
  }
  style.backgroundImage = `url(\"${src}\")`;
  return h("div.lithology-swatch", { style, ...rest });
};

const LithologyItem = function (props) {
  const { symbol, lithology } = props;
  return h("span.facies-picker-row", [
    h(LithologySwatch, { symbolID: symbol }),
    h("span.facies-picker-name", lithology),
  ]);
};

const LithologyPicker = (props) => {
  const { interval, onChange } = props;
  const { lithologies } = useContext(LithologyContext);

  console.log("lithologies", lithologies, interval);

  let options = [];
  for (let item of lithologies) {
    const { id, pattern } = item;
    const symbol = symbolIndex[pattern];
    // if (symbol == null) {
    //   continue;
    // }
    options.push({
      value: id,
      label: h(LithologyItem, { lithology: id, symbol }),
    });
  }

  let value = options.find((d) => d.value === interval.lithology_id);

  return h(RaisedSelect, {
    id: "lithology-select",
    options,
    value,
    isClearable: true,
    onChange(res) {
      const f = res != null ? res.value : null;
      return onChange(f);
    },
  });
};

const SymbolPickerInner = function (props) {
  let symbol;
  const { interval, onClose, style } = props;
  let isUserSet = false;

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

  return h("div.lithology-symbol-picker-inner", { style }, [
    h.if(symbol != null)(LithologySwatch, { symbolID: symbol }),
    h("div.picker-label.text", text),
    h.if(onClose != null)(
      Button,
      {
        small: true,
        icon: "cross",
        intent: Intent.DANGER,
        minimal: true,
        onClick: onClose,
      },
      "Clear override"
    ),
  ]);
};

const LithologySymbolPicker = function (props) {
  const { interval, updatePattern } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  const className = isExpanded ? "expanded" : "hidden";

  return h("div.lithology-symbol-picker", { className }, [
    h(
      Button,
      {
        className: "expand-button",
        onClick() {
          setIsExpanded(true);
        },
        minimal: true,
        small: true,
        intent: Intent.WARNING,
      },
      "Override lithology pattern"
    ),
    h(SymbolPickerInner, {
      interval,
      onClose: () => setIsExpanded(false),
      updatePattern,
    }),
  ]);
};

export { LithologyPicker, LithologySymbolPicker };
