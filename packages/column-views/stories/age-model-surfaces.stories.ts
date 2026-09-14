/** Stories for the surfaces view: a column's age-model calibration surfaces
 * drawn as lines and labels, with an inspector for the selected surface. */
import hyper from "@macrostrat/hyper";
import { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import type { AgeModelBoundary, UnitLong } from "@macrostrat/api-types";

import {
  Column,
  ColoredUnitComponent,
  ColumnSurfaces,
  type ColumnSurface,
  type ColumnSurfacesProps,
  type SurfaceStatus,
  SurfaceDetailsPanel,
  SurfaceStatusLegend,
  surfacesFromBoundaries,
  surfacesFromUnits,
  surfaceStatuses,
} from "../src";
import { useAPIResult } from "@macrostrat/ui-components";
import { useMacrostratBaseURL } from "@macrostrat/data-provider";
import illinois from "./data/illinois-432.json";
import styles from "./age-model-surfaces.stories.module.sass";

const h = hyper.styled(styles);

interface SurfacesStoryProps extends Omit<
  ColumnSurfacesProps,
  "selectedSurface" | "onSelectSurface"
> {
  columnID: number;
  /** Static units to render instead of fetching the column */
  units?: UnitLong[];
  title?: string;
  description?: string;
  statusFilter?: SurfaceStatus[] | null;
}

/** Column on the left, legend and inspector on the right. */
function SurfacesStoryUI(props: SurfacesStoryProps) {
  const {
    columnID,
    units: staticUnits,
    title,
    description,
    statusFilter,
    ...surfaceProps
  } = props;
  // Only fetch when no static units were given
  let fetchID: number | null = columnID;
  if (staticUnits != null) fetchID = null;
  const fetchedUnits = useStoryColumnUnits(fetchID);
  const info = useStoryColumnInfo(fetchID);
  const units = staticUnits ?? fetchedUnits;

  const [selected, setSelected] = useState<ColumnSurface | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);

  if (units == null) {
    return h(Spinner);
  }

  let detailsPanel = h(
    "p.placeholder",
    "Select a surface (a line or a label) to inspect it.",
  );
  if (selected != null) {
    detailsPanel = h(SurfaceDetailsPanel, {
      surface: selected,
      onClose: () => setSelected(null),
      onSelectUnit: setSelectedUnit,
    });
  }

  return h("div.surfaces-story", [
    h("div.column-pane", [
      h("h2", title ?? info?.col_name ?? `Column ${columnID}`),
      h.if(description != null)("p.description", description),
      h(
        Column,
        {
          units,
          unitComponent: ColoredUnitComponent,
          unconformityLabels: true,
          showUnitPopover: true,
          selectedUnit,
          onUnitSelected: setSelectedUnit,
          columnWidth: 250,
          width: 400,
        },
        h(ColumnSurfaces, {
          ...surfaceProps,
          statuses: statusFilter,
          selectedSurface: selected?.id ?? null,
          onSelectSurface: setSelected,
        }),
      ),
    ]),
    h("div.side-pane", [
      h("h3", "Surface details"),
      detailsPanel,
      h("h3", "Legend"),
      h(SurfaceStatusLegend, { showDescriptions: true }),
    ]),
  ]);
}

/** Units for a column, from the API the Storybook data provider points at.
 * Nothing is fetched while `col_id` is null. */
function useStoryColumnUnits(col_id: number | null): UnitLong[] | null {
  const baseURL = useMacrostratBaseURL();
  const params = useMemo(
    () => ({ col_id, response: "long", show_position: true }),
    [col_id],
  );
  let route: string | null = null;
  if (col_id != null) route = baseURL + "/units";
  return useAPIResult(route, params, (res) => res.success.data) ?? null;
}

function useStoryColumnInfo(col_id: number | null) {
  const baseURL = useMacrostratBaseURL();
  const params = useMemo(() => ({ col_id }), [col_id]);
  let route: string | null = null;
  if (col_id != null) route = baseURL + "/columns";
  return useAPIResult(route, params, (res) => res.success?.data?.[0]) ?? null;
}

const meta: Meta<SurfacesStoryProps> = {
  title: "Column views/Age model surfaces",
  component: SurfacesStoryUI,
  args: {
    columnID: 432,
    showLines: true,
    showLabels: true,
    extent: "units",
    fallbackToUnits: true,
    labelWidth: 170,
  },
  argTypes: {
    columnID: { control: { type: "number" } },
    extent: { options: ["units", "column"], control: { type: "radio" } },
    statusFilter: {
      options: surfaceStatuses,
      control: { type: "check" },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Age-model calibration surfaces from the `/age_model` route, drawn on a column. " +
          "Lines are styled by `boundary_status` (how the age is constrained) and " +
          "`boundary_type` (the nature of the contact); labels give the calibration " +
          "interval, the position within it, and the modeled age. Columns without " +
          "`unit_boundaries` fall back to surfaces derived from unit tops and bottoms.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<SurfacesStoryProps>;

/** Column 432 (Illinois), live from the API. */
export const LiveColumn: Story = {};

export const LabelsOnly: Story = {
  args: { showLines: false },
};

export const LinesAcrossWholeColumn: Story = {
  args: { showLabels: false, extent: "column" },
};

/** Only the surfaces that carry independent age information. */
export const CalibratedSurfacesOnly: Story = {
  args: { statusFilter: ["absolute", "relative", "spike", "imposed"] },
};

/** The fallback path, on a static fixture so it renders offline: no age
 * model is fetched, every distinct unit top and bottom becomes a surface. */
export function DerivedFromUnits() {
  const units = illinois.success.data as any as UnitLong[];
  const surfaces = useMemo(() => surfacesFromUnits(units), [units]);
  return h(SurfacesStoryUI, {
    columnID: 432,
    units,
    surfaces,
    title: "Illinois (static fixture)",
    description:
      "Surfaces derived from unit tops and bottoms — the fallback for a column without age-model boundaries.",
  });
}

/** Every status and a few contact types, on synthetic boundaries built from
 * the fixture's unit surfaces — so the styling can be reviewed without a
 * column that happens to carry them all. */
export function StatusMatrix() {
  const units = illinois.success.data as any as UnitLong[];
  const surfaces = useMemo(() => syntheticBoundaries(units), [units]);
  return h(SurfacesStoryUI, {
    columnID: 432,
    units,
    surfaces,
    title: "Synthetic status matrix",
    description:
      "Not real data: the fixture's unit surfaces re-cast as age-model boundaries, cycling through every boundary status and type, to review the line styles.",
  });
}

const statusCycle: AgeModelBoundary["boundary_status"][] = [
  "absolute",
  "relative",
  "modeled",
  "spike",
  "imposed",
  "",
];
const typeCycle: AgeModelBoundary["boundary_type"][] = [
  "",
  "conformity",
  "",
  "unconformity",
  "",
  "fault",
  "disconformity",
  "",
  "angular unconformity",
];

function syntheticBoundaries(units: UnitLong[]): ColumnSurface[] {
  const derived = surfacesFromUnits(units);
  const unitMap = new Map(units.map((u) => [u.unit_id, u]));
  const boundaries: AgeModelBoundary[] = derived.map((s, i) => {
    // Calibrate against the interval of the unit below (its top interval)
    const below = unitMap.get(s.unitsBelow[0]);
    const above = unitMap.get(s.unitsAbove[0]);
    const ref = below ?? above;
    const age_bottom = ref?.b_int_age ?? s.age + 10;
    const age_top = ref?.t_int_age ?? Math.max(s.age - 10, 0);
    const span = age_bottom - age_top;
    let rel_position = 0.5;
    if (span > 0) {
      rel_position = Math.min(Math.max((age_bottom - s.age) / span, 0), 1);
    }
    return {
      boundary_id: 900000 + i,
      col_id: 432,
      section_id: s.section_id ?? 0,
      interval_id: ref?.t_int_id ?? 0,
      interval_name: ref?.t_int_name ?? "Unknown",
      age_bottom,
      age_top,
      rel_position,
      model_age: s.age,
      boundary_status: statusCycle[i % statusCycle.length],
      boundary_type: typeCycle[i % typeCycle.length],
      boundary_position: null,
      unit_below: s.unitsBelow[0] ?? 0,
      unit_above: s.unitsAbove[0] ?? 0,
      ref_id: 217,
    };
  });
  return surfacesFromBoundaries(boundaries);
}
