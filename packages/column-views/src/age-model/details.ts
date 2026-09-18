/** The inspector for a selected surface, and the small tags and legend that
 * explain surface statuses and types. */
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { type ReactNode, useMemo } from "react";
import { Button, Tag } from "@blueprintjs/core";
import {
  DataField,
  Identifier,
  type IntervalShort,
  IntervalTag,
  UnitIdentifier,
  Value,
} from "@macrostrat/data-components";
import { useMacrostratDefs } from "@macrostrat/data-provider";
import type { UnitLong } from "@macrostrat/api-types";
import { useColumnUnitsMap } from "../data-provider";
import { AgeLabel, Proportion } from "../unit-details/age-range";
import { formatRange } from "../unit-details/utils";
import { ReferencesField } from "../unit-details/panel";
import { surfaceClasses } from "./surfaces";
import surfaceStyles from "./surfaces.module.sass";
import styles from "./details.module.sass";
import {
  type BoundaryType,
  type ColumnSurface,
  type SurfaceStatus,
  formatProportion,
  surfaceStatuses,
  surfaceStatusDescriptions,
  surfaceStatusLabels,
} from "./types";

const h = hyper.styled({ ...surfaceStyles, ...styles });

export interface SurfaceDetailsPanelProps {
  surface: ColumnSurface;
  onClose?: () => void;
  /** Called when a unit above or below the surface is clicked */
  onSelectUnit?: (unitID: number) => void;
  /** Extra controls for the header */
  actions?: ReactNode;
  /** Label for the measured-position field ("Height" or "Depth") */
  positionLabel?: string;
  className?: string;
}

/** Details of one surface: its age, calibration, the units it separates, and
 * provenance. A companion to `UnitDetailsPanel`. */
export function SurfaceDetailsPanel(props: SurfaceDetailsPanelProps) {
  const {
    surface,
    onClose,
    onSelectUnit,
    actions,
    positionLabel = "Position",
    className,
  } = props;

  let closeButton: ReactNode = null;
  if (onClose != null) {
    closeButton = h(Button, {
      icon: "cross",
      variant: "minimal",
      size: "small",
      onClick: onClose,
      "aria-label": "Close",
    });
  }

  let positionField: ReactNode = null;
  if (surface.position != null) {
    positionField = h(DataField, {
      label: positionLabel,
      value: surface.position.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      }),
      unit: "m",
    });
  }

  let sectionField: ReactNode = null;
  if (surface.section_id != null) {
    sectionField = h(
      DataField,
      { label: "Section" },
      h(Identifier, { id: surface.section_id }),
    );
  }

  let refsField: ReactNode = null;
  if (surface.ref_id != null) {
    refsField = h(ReferencesField, { refs: [surface.ref_id] });
  }

  return h(
    "div.surface-details-panel",
    { className: classNames(className, surfaceClasses(surface)) },
    [
      h("div.surface-details-header", [
        h("h3.surface-details-title", [
          "Surface ",
          h(SurfaceIdentifier, { id: surface.id }),
        ]),
        h("div.surface-details-tags", [
          h(SurfaceStatusTag, {
            status: surface.status,
            inferred: surface.statusInferred,
          }),
          h(SurfaceTypeTag, { type: surface.type }),
        ]),
        h("div.spacer"),
        actions,
        closeButton,
      ]),
      h("div.surface-details-content", [
        h(DataField, { label: "Model age" }, h(AgeLabel, { age: surface.age })),
        h(SurfaceCalibrationField, { surface }),
        positionField,
        h(SurfaceUnitsField, {
          label: "Unit above",
          unitIDs: surface.unitsAbove,
          onSelectUnit,
        }),
        h(SurfaceUnitsField, {
          label: "Unit below",
          unitIDs: surface.unitsBelow,
          onSelectUnit,
        }),
        sectionField,
        refsField,
      ]),
    ],
  );
}

function SurfaceIdentifier({ id }: { id: ColumnSurface["id"] }) {
  if (typeof id === "number") {
    return h(Identifier, { id });
  }
  return h("code.surface-id", String(id));
}

/** The calibration interval as a colored tag, with the surface's position in
 * it: "Calymmian (1600–1400 Ma), 85% above base". */
function SurfaceCalibrationField({ surface }: { surface: ColumnSurface }) {
  const { calibration, proportion } = surface;
  const ids = useMemo(() => {
    if (calibration == null) return [];
    return [calibration.id];
  }, [calibration?.id]);
  // Interval colors come from the definitions table; the age model itself
  // doesn't carry them
  const intervalMap = useMacrostratDefs("intervals", ids, null);

  if (calibration == null) {
    return h(DataField, {
      label: "Calibration",
      value: "None",
      className: "no-calibration",
    });
  }

  const def = intervalMap?.get(calibration.id);
  const interval: IntervalShort = {
    id: calibration.id,
    name: calibration.name,
    b_age: calibration.b_age,
    t_age: calibration.t_age,
    color: def?.color,
    rank: def?.rank,
  };

  return h(DataField, { label: "Calibration" }, [
    h(
      "div.calibration-interval",
      h(IntervalTag, {
        interval,
        prefix: h(Proportion, { value: proportion }),
      }),
    ),
  ]);
}

function SurfaceUnitsField({
  label,
  unitIDs,
  onSelectUnit,
}: {
  label: string;
  unitIDs: number[];
  onSelectUnit?: (unitID: number) => void;
}) {
  const unitsMap = useColumnUnitsMap();
  if (unitIDs.length === 0) {
    return h(DataField, { label, value: "None", className: "no-units" });
  }
  return h(
    DataField,
    { label, className: "surface-units-field" },
    h(
      "ul.surface-units-list",
      unitIDs.map((unitID) => {
        const unit = unitsMap?.get(unitID) as UnitLong | undefined;
        let onClick: (() => void) | undefined = undefined;
        if (onSelectUnit != null) {
          onClick = () => onSelectUnit(unitID);
        }
        return h(
          "li",
          { key: unitID },
          h(UnitIdentifier, {
            unitID,
            colID: unit?.col_id,
            name: unit?.unit_name,
            onClick,
          }),
        );
      }),
    ),
  );
}

export function SurfaceStatusTag({
  status,
  inferred = false,
  className,
}: {
  status: SurfaceStatus;
  /** The status was inferred rather than recorded (see
   * `inferTiePointStatuses`); the tag says so. */
  inferred?: boolean;
  className?: string;
}) {
  let label: ReactNode = surfaceStatusLabels[status] ?? status;
  let title = surfaceStatusDescriptions[status];
  if (inferred) {
    label = [label, h("span.inferred-marker", "*")];
    title = INFERRED_STATUS_DESCRIPTION;
  }

  return h(
    Tag,
    {
      variant: "minimal",
      className: classNames(
        "surface-tag",
        className,
        surfaceClasses({ status }),
        { inferred },
      ),
      title,
    },
    label,
  );
}

const INFERRED_STATUS_DESCRIPTION =
  "Recorded as modeled, but this surface cannot have been interpolated — it " +
  "sits on the base or top of its interval, or is the edge of a gap-bound " +
  "package — so it constrains the age model rather than falling out of it";

export function SurfaceTypeTag({
  type,
  className,
}: {
  type: BoundaryType | null | undefined;
  className?: string;
}) {
  if (type == null || type === "") return null;
  return h(
    Tag,
    {
      variant: "minimal",
      className: classNames("surface-tag", "surface-type-tag", className),
    },
    type,
  );
}

export interface SurfaceStatusLegendProps {
  statuses?: SurfaceStatus[];
  showDescriptions?: boolean;
  className?: string;
}

/** A legend of surface line styles, one entry per boundary status. */
export function SurfaceStatusLegend(props: SurfaceStatusLegendProps) {
  const {
    statuses = surfaceStatuses,
    showDescriptions = false,
    className,
  } = props;
  return h(
    "ul.surface-status-legend",
    {
      className: classNames(className, {
        "with-descriptions": showDescriptions,
      }),
    },
    statuses.map((status) => {
      let description: ReactNode = null;
      if (showDescriptions) {
        description = h(
          "div.legend-description",
          surfaceStatusDescriptions[status],
        );
      }
      return h(
        "li.legend-item",
        { key: status, className: surfaceClasses({ status }) },
        [
          h("div.surface-label-marker"),
          h("div.legend-text", [
            h("div.legend-label", surfaceStatusLabels[status]),
            description,
          ]),
        ],
      );
    }),
  );
}
