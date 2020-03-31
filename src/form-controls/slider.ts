import h from '@macrostrat/hyper';
import {useState, useEffect} from 'react';
import {
  InputGroup,
  Button,
  ButtonGroup,
  Collapse,
  Slider,
  Card,
  Intent,
  FormGroup,
  ISliderProps
} from '@blueprintjs/core';
import {Spec} from 'immutability-helper'
import classNames from 'classnames'
import styles from './main.styl'


const ControlledSlider = (props: ISliderProps)=>{
  const [value, setValue] = useState<number>(props.value)
  const onChange = (v)=>{
    setValue(v),
    props.onChange?.(v)
  }
  useEffect(()=>setValue(props.value), [props.value])

  return h(Slider, {...props, onChange, value})
}

const NullableSlider = (props: ISliderProps)=>{
  let {value, showTrackFill, className, ...rest} = props
  if (value == null) {
    value = rest.min ?? 0
    showTrackFill = false
    className = classNames(className, "mui-slider-disabled")
  }
  return h(ControlledSlider, {...rest, className, value, showTrackFill})
}

export {ControlledSlider, NullableSlider}
