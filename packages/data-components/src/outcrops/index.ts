import h from "@macrostrat/hyper";

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
}

export function CheckinListing(props: CheckinListingProps) {
  const { checkin } = props;
  return h("div.checkin", [h("p", [checkin.notes]), h("h3", [checkin.year])]);
}
