import hyper from "@macrostrat/hyper";
import { AnchorButton, Icon } from "@blueprintjs/core";
import styles from "./base.module.sass";

const h = hyper.styled(styles);

export function LocationBasicInfo({
  title,
  year,
  description,
  imageURL,
  link,
  rating,
  className,
}: {
  title: string | null;
  year: string;
  description?: string;
  imageURL?: string;
  link: string;
  rating?: number;
  className?: string;
}) {
  let _title = title ?? "";
  let headerClassName = null;
  if (title == "") {
    _title = "Unnamed location";
    headerClassName = "unnamed";
  }

  return h("div.location-basic-info", { className }, [
    h("div.location-header", { className: headerClassName }, [
      h("h2", [title]),
      h("h3.year", [year]),
      h(LocationLink, { href: link }),
    ]),
    h.if(description != null)("p.description", [description]),
    h("div.image-panel", [
      h.if(imageURL != null)("img", { src: imageURL }),
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
      icon: "link",
      small: true,
      minimal: true,
      className: "location-link",
      target: "_blank",
    },
    [h(Icon, { icon: "link", size: 14 }), children]
  );
}
