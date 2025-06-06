import hyper from "@macrostrat/hyper";
import { Icon } from "@blueprintjs/core";
import styles from "./base.module.sass";
import type { AnyMapPosition } from "@macrostrat/mapbox-utils";

const h = hyper.styled(styles);

export interface LocationBasicInfoProps {
  title: string | null;
  year: string | number;
  description?: string;
  imageURL?: string;
  link: string;
  rating?: number;
  className?: string;
  location?: AnyMapPosition;
}

export function LocationBasicInfo({
  title,
  year,
  description,
  imageURL,
  link,
  rating,
  className,
  location,
}: LocationBasicInfoProps) {
  let _title = title ?? "";
  let headerClassName = null;
  if (title == "") {
    _title = "Unnamed location";
    headerClassName = "unnamed";
  }

  const hasImage = imageURL != null;

  return h("div.location-basic-info", { className }, [
    h("div.location-header", { className: headerClassName }, [
      h.if(location != null)(LocationButton, { location }),
      h("h3.title", [title]),
      h("h4.year", [year]),
      h(LocationLink, { href: link }),
    ]),
    h.if(description != null)("p.description", [description]),
    h("div.image-panel", { className: hasImage ? "has-image" : "no-image" }, [
      h.if(hasImage)("img", { src: imageURL }),
      h.if(rating != null)(StarRatingComponent, { rating }),
    ]),
  ]);
}

export function StarRatingComponent({ rating: r }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const icon = i < r ? "star" : "star-empty";
    return h(Icon, { icon });
  });
  return h("div.star-rating", stars);
}

export function LocationLink({
  href,
  children,
}: {
  href: string;
  children: any;
}) {
  return h(
    "a",
    {
      href,
      className: "location-link",
      target: "_blank",
    },
    [h(Icon, { icon: "link", size: 14 }), children]
  );
}

function LocationButton({
  location,
  onClick,
}: {
  location: AnyMapPosition;
  onClick?: () => void;
}) {
  return h("button.location-button", { onClick }, [
    h(Icon, { icon: "map-marker" }),
  ]);
}
