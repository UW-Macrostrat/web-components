import { ComponentMeta } from "storybook";
import { MeasuredSection } from "./base-section";
import h from "@macrostrat/hyper";

const images = import.meta.glob(
  "./sunrift-gorge-photos/sunrift-gorge-v1-*.jpg",
  { eager: true }
);

function ImageBackdrop({ images, width, inset }) {
  return h(
    "div.images",
    {
      style: {
        display: "flex",
        flexDirection: "column-reverse",
      },
    },
    images.map((value) => {
      return h(
        "div",
        {
          style: {
            overflow: "hidden",
          },
        },
        [
          h("img", {
            src: value,
            style: {
              width,
              marginTop: -inset,
              marginBottom: -inset,
            },
          }),
        ]
      );
    })
  );
}

interface SunriftGorgeProps {
  generalized: boolean;
  sequenceStratigraphy: boolean;
}

export function SunriftGorgeSection({
  generalized = false,
  sequenceStratigraphy = true,
}: SunriftGorgeProps) {
  // return h(MeasuredSection, { range: [0, 30], pixelScale: 100 }, [
  //   h(ImageBackdrop, {
  //     width: 320,
  //     images: Object.values(images).map((val) => val.default),
  //     inset: 36,
  //   }),
  // ]);
  return h(ImageBackdrop, {
    width: 320,
    images: Object.values(images).map((val) => val.default),
    inset: 36,
  });
}

export default {
  title: "Column components/Sunrift Gorge",
  component: SunriftGorgeSection,
  args: {
    generalized: false,
    sequenceStratigraphy: true,
  },
} as ComponentMeta<typeof SunriftGorgeSection>;
