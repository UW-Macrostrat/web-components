interface SunriftGorgeProps {
  generalized: boolean;
  sequenceStratigraphy: boolean;
}

function SunriftGorgeSection({}: SunriftGorgeProps) {
  return null;
}

export default {
  title: "Column components/Field stratigraphy",
  component: SunriftGorgeSection,
  args: {
    generalized: false,
    sequenceStratigraphy: true,
  },
} as ComponentMeta<typeof MeasuredSection>;
