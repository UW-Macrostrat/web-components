/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import T from 'prop-types';
import {hyperStyled} from "@macrostrat/hyper";
import styles from "./main.styl";
import {format} from 'd3-format';
import {IntervalShape} from './types';
import Select from 'react-select';
const h = hyperStyled(styles);

const LabeledControl = function(props){
  const {title, children, ...rest} = props;
  delete rest.is;
  return h('div.labeled-control', [
    h('label.bp3-label', null, [
      h.if(title != null)('span.label-text', null, title)
    ]),
    (props.is != null) ? h(props.is, rest) : null
  ]);
};


const menuStyles = provided => (({
    ...provided,
    zIndex: 999
  }));

const RaisedSelect = props => h(Select, {styles: {menu: menuStyles}, ...props});


const IntervalEditorTitle = function(props){
  let {showID, title, interval, heightFormat} = props;
  const {id, top, bottom} = interval;
  let fmt = v => v;
  if (heightFormat != null) {
    fmt = format(heightFormat);
  }
  if (showID == null) { showID = true; }
  return h("div.editor-dialog-title.editor-title", [
    h("h3.title-center", title),
    h("h4.height-range", `${fmt(bottom)} – ${fmt(top)} m`),
    h("h4.id", null, [
      "ID: ",
      h.if((id != null) && showID)("code", id)
    ])
  ]);
};

IntervalEditorTitle.propTypes = {
  showID: T.bool,
  title: T.node.isRequired,
  interval: IntervalShape.isRequired,
  heightFormat: T.string
};

export {LabeledControl, IntervalEditorTitle, RaisedSelect};
