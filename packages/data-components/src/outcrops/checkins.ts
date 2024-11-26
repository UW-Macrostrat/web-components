import h from "@macrostrat/hyper";
import { AnchorButton, Icon } from "@blueprintjs/core";

export interface CheckinListingData {
  id: number;
  person: number;
  photo: number;
  notes: string;
  rating: number;
  year: number;
}

export interface CheckinListingProps {
  checkin: CheckinListingData;
  rockdBaseURL?: string;
}

export function CheckinListing(props: CheckinListingProps) {
  const { checkin, rockdBaseURL = "https://rockd.org" } = props;
  const { person, photo } = checkin;
  const imageURL =
    rockdBaseURL + `/api/v1/protected/image/${person}/banner/${photo}`;

  const { title, description } = synthesizeTitleAndDescription(checkin.notes);

  return h("div.checkin", [
    h("h2", [title]),
    h("h3", [checkin.year]),
    h.if(description != null)("p", [description]),
    h("img", { src: imageURL }),
    h(RatingComponent, { rating: checkin.rating }),
    h(CheckinLink, { checkinID: checkin.id, showID: true }),
  ]);
}

export function RatingComponent({ rating: r }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const icon = i < r ? "star" : "star-empty";
    return h(Icon, { icon });
  });
  return h("div.rating", stars);
}

function CheckinLink({
  checkinID,
  rockdBaseURL = "https://rockd.org",
  showID = false,
}) {
  return h(
    AnchorButton,
    {
      href: `${rockdBaseURL}/checkin/${checkinID}`,
      icon: "link",
      small: true,
      minimal: true,
    },
    [h.if(showID)("span.checkin-id", checkinID)]
  );
}

export function synthesizeTitleAndDescription(notes): {
  title: string;
  description: string;
} {
  // Title and description management taken from the Rockd app
  /** We have a pretty awkward approach to checkin 'notes' that encompasses the
   * concept of title and description. Here we attempt to regularize peoples'
   * notes into a more readable form, as preparation for doing so in a more
   * structured way in the future (perhaps using a database update?).
   */
  let title = notes;
  let description = null;

  if (title.length > 80) {
    // See if we can shorten the title
    // We'll try to find the first punctuation mark (.,;:), and cut off there
    let punctuationIndex = title.search(/[.,;:]/);
    if (punctuationIndex > 0) {
      title = strip(title.slice(0, punctuationIndex));
      // We leave the actual punctuation mark to the imagination
      description = strip(notes.slice(punctuationIndex + 1));
    }
  }
  return {
    title: sentenceCase(title),
    description: sentenceCase(description),
  };
}

function strip(input: string): string {
  // Strip leading and trailing whitespace
  return input.replace(/^\s+|\s+$/g, "");
}

function sentenceCase(input: string | null): string | null {
  // Capitalize the first letter of a string
  if (input == null) return null;
  return input.charAt(0).toUpperCase() + input.slice(1);
}
