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

  return h("div.checkin", [
    h("p", [checkin.notes]),
    h("h3", [checkin.year]),
    h("img", { src: imageURL }),
    h(RatingComponent, { rating: checkin.rating }),
    h(CheckinLink, { checkinID: checkin.id }),
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
