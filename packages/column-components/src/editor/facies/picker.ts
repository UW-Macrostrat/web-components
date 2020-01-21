/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component} from 'react';
import {hyperStyled} from '@macrostrat/hyper';
import {FaciesContext} from '../../context';
import {BasicFaciesSwatch} from './color-picker';
import Select from 'react-select';
import styles from '../main.styl';

const h = hyperStyled(styles);

const FaciesRow = ({facies}) => h('span.facies-picker-row', [
  h(BasicFaciesSwatch, {facies, className: 'facies-color-swatch'}),
  h('span.facies-picker-name', facies.name)
]);

class FaciesPicker extends Component {
  static initClass() {
    this.contextType = FaciesContext;
  }
  render() {
    const {facies} = this.context;
    const {interval, onChange} = this.props;

    const options = facies.map(f => ({
      value: f.id,
      label: h(FaciesRow, {facies: f})
    }));

    let value = options.find(d => d.value === interval.facies);
    if (value == null) { value = null; }

    return h(Select, {
      id: 'facies-select',
      options,
      value,
      selected: interval.facies,
      onChange(res){
        const f = (res != null) ? res.value : null;
        return onChange(f);
      }
    });
  }
}
FaciesPicker.initClass();

export {FaciesPicker};
