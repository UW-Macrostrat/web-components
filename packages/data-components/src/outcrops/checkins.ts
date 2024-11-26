import h from "@macrostrat/hyper";
import { LocationBasicInfo } from "./base";

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

  return h(LocationBasicInfo, {
    title,
    year: checkin.year.toString(),
    description,
    imageURL,
    link: `${rockdBaseURL}/checkin/${checkin.id}`,
    rating: checkin.rating,
    className: "checkin",
  });
}

export function synthesizeTitleAndDescription(notes): {
  title: string | null;
  description: string | null;
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
