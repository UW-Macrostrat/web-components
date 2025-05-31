import {
  DetritalSpectrumPlot,
  DetritalSeries,
  usePlotArea,
} from "@macrostrat/data-components";
import { IUnit } from "@macrostrat/column-views";
import hyper from "@macrostrat/hyper";
import { useDetritalMeasurements, MeasurementInfo } from "./provider";
import { useMacrostratUnits } from "../data-provider";
import { ColumnNotes } from "../notes";
import { useMemo, useRef } from "react";
import styles from "./index.module.sass";
import { useInView } from "react-spring";
import classNames from "classnames";

const h = hyper.styled(styles);

interface DetritalItemProps {
  note: {
    data: MeasurementInfo[];
    unit?: IUnit;
  };
  spacing?: {
    below?: number;
    above?: number;
  };
  width?: number;
  height?: number;
  color?: string;
}

function DepositionalAge({ unit }) {
  const { xScale, height } = usePlotArea();

  const { t_age, b_age } = unit;
  const x = xScale(t_age);
  const x1 = xScale(b_age);

  return h("rect.depositional-age", { x, width: x1 - x, y: 0, height });
}

function DetritalGroup(props: DetritalItemProps) {
  const { note, width, height, color, spacing } = props;
  const { data, unit } = note;
  const { geo_unit } = data[0];

  const _color = color;

  const spaceBelow = spacing?.below ?? 100;
  const hideAxisLabels = spaceBelow < 60;

  return h(
    "div.detrital-group",
    { className: classNames({ "hide-axis": hideAxisLabels }) },
    [
      h(
        DetritalSpectrumPlot,
        { width, innerHeight: height, showAxisLabels: true, paddingBottom: 40 },
        [
          h.if(unit != null)(DepositionalAge, { unit }),
          data.map((d) => {
            return h(DetritalSeries, {
              bandwidth: 20,
              data: d.measure_value,
              color: _color,
            });
          }),
        ]
      ),
    ]
  );
}

const matchingUnit = (dz) => (d) => d.unit_id == dz[0].unit_id;

function DetritalColumn({ columnID, color = "magenta" }) {
  const data = useDetritalMeasurements({ col_id: columnID });
  const units = useMacrostratUnits();

  const notes: any[] = useMemo(() => {
    if (data == null || units == null) return [];
    let dzUnitData = Array.from(data.values());
    dzUnitData.sort((a, b) => {
      const v1 = units.findIndex(matchingUnit(a));
      const v2 = units.findIndex(matchingUnit(b));
      return v1 > v2;
    });

    const data1 = dzUnitData.map((d) => {
      const unit = units.find(matchingUnit(d));
      return {
        top_height: unit?.t_age,
        height: unit?.b_age,
        data: d,
        unit,
        id: unit?.unit_id,
      };
    });

    return data1.filter((d) => d.unit != null);
  }, [data, units]);

  const width = 400;
  const paddingLeft = 40;

  const spectrumWidth = width - paddingLeft;

  const noteComponent = useMemo(() => {
    return (props) => {
      return h(DetritalGroup, {
        width: spectrumWidth,
        height: 40,
        color,
        ...props,
      });
    };
  }, [width, color]);

  if (data == null || units == null) return null;

  return h(
    "div.dz-spectra",
    h(ColumnNotes, {
      width,
      paddingLeft,
      notes,
      noteComponent,
      deltaConnectorAttachment: 20,
    })
  );
}

export { DetritalColumn, DetritalGroup };
