import h from "@macrostrat/hyper";
import {
  ColumnAxis,
  ColumnProvider,
  ColumnSVG,
  TriangleBars,
  useColumn,
} from "@macrostrat/column-components";

export default {
  title: "Column components/Triangle bars legend",
  component: TriangleBarsLegend,
} as ComponentMeta<typeof TriangleBarsLegend>;

export function TriangleBarsLegend() {
  return h(
    ColumnProvider,
    {
      range: [0, 2],
      divisions: [
        { bottom: -1, surface_type: "sb", surface_order: 0 },
        { bottom: 0, surface_type: "mfs", surface_order: 0 },
        { bottom: 1, surface_type: "sb", surface_order: 0 },
        { bottom: 2, surface_type: "mfs", surface_order: 0 },
        { bottom: 3, surface_type: "sb", surface_order: 0 },
      ],
      pixelsPerMeter: 30,
    },
    h(ColumnSVG, { width: 70, paddingLeft: 5, padding: 10 }, [
      h(LegendSurfaces),
      h(TriangleBars, {
        minOrder: 0,
        maxOrder: 0,
        offsetLeft: 10,
        lineWidth: 30,
      }),
    ]),
  );
}

function LegendSurfaces({ offsetLeft = 0 }) {
  const notes = [
    { height: 0, label: "sb", className: "sequence-boundary" },
    {
      height: 1,
      label: "mfs",
      className: "maximum-flooding-surface",
    },
    { height: 2, label: "sb", className: "sequence-boundary" },
  ];

  const { scale } = useColumn();

  return h(
    "g.sequence-stratigraphic-surfaces",
    {
      transform: `translate(${offsetLeft} 0)`,
    },
    [
      notes.map((note, index) => {
        const y = scale(note.height);
        return h("g.surface", { key: index, transform: `translate(0 ${y})` }, [
          h("line", {
            x1: 15,
            x2: 50,
            y1: 0,
            y2: 0,
            className: note.className,
            strokeWidth: 2,
            stroke: "black",
          }),
          h(
            "text",
            {
              x: 50,
              y: 0,
              fontSize: 10,
              dominantBaseline: "middle",
            },
            note.label,
          ),
        ]);
      }),
    ],
  );
}
