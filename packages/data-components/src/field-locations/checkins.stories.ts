import h from "@macrostrat/hyper";
import type { Meta, StoryObj } from "@storybook/react";
import { CheckinListingProps, CheckinListing } from "./checkins";

const checkinExamples = {
  "New York City": {
    id: 22163,
    person: 104801,
    photo: 47399,
    notes: "Tightly folded metasedimentary rocks",
    rating: 5,
    year: 2023,
  },
  "Baltimore Gneiss": {
    id: 15406,
    person: 58021,
    photo: 35047,
    notes: "Baltimore gneiss outcropping in Patapsco State Park.",
    rating: 3,
    year: 2022,
  },
  "Coal in West Virginia": {
    id: 11477,
    person: 27398,
    photo: 26390,
    notes:
      "Very compact shaly sandstone above a coal layer. Fossils prevalent beneath coal layer. All plant fossils. Calamites, Lepidodendron, seed ferns, etc.",
    rating: 5,
    year: 2020,
  },
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<CheckinListingProps> = {
  title: "Data components/Field locations/Checkin listing",
  component: CheckinListing,
  argTypes: {
    checkin: {
      options: Object.keys(checkinExamples),
      mapping: checkinExamples,
    },
  },
};

export default meta;

type Story = StoryObj<CheckinListingProps>;

export const Primary: Story = {
  args: {
    checkin: checkinExamples["New York City"],
  },
};
