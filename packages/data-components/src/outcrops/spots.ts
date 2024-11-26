import h from "@macrostrat/hyper";
import { AnchorButton, Icon } from "@blueprintjs/core";

export interface SpotBasicData {
  id: number;
  date: string;
  name: string;
  notes: string;
  images?: SpotImage[];
  altitude: number;
  landing_page: string;
}

interface SpotImage {
  id: number;
  width: number;
  height: number;
  caption: string;
  title: string;
}

export interface SpotListingProps {
  spot: SpotBasicData;
  rockdBaseURL?: string;
}

/* Image URLs:
Original Image:
https://strabospot.org/pi/17326427706747

Thumbnail Image:
https://strabospot.org/pi_thumbnail/17326427706747
 */

export function SpotListing(props: SpotListingProps) {
  const { spot } = props;

  const image = spot.images?.[0];

  let imageURL = null;
  if (image != null) {
    imageURL = `https://strabospot.org/pi/${image.id}`;
  }

  let year = new Date(spot.date).getFullYear();

  return h("div.spot", [
    h(SpotBasicInfo, {
      title: spot.name,
      year,
      description: spot.notes,
      imageURL,
    }),
    h(SpotLink, { href: spot.landing_page }, "View on StraboSpot"),
  ]);
}

function SpotLink({ href, children }: { href: string; children: any }) {
  return h(
    AnchorButton,
    {
      href,
      icon: "link",
      small: true,
      minimal: true,
    },
    children
  );
}

function SpotBasicInfo({ title, year, description, imageURL }) {
  return h("div.spot-basic-info", [
    h("h2", [title]),
    h("h3", [year]),
    h.if(description != null)("p", [description]),
    h.if(imageURL != null)("img", { src: imageURL }),
  ]);
}
